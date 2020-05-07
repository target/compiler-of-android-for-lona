import fs from 'fs'
import path from 'path'
import { createFs, IFS, copy } from 'buffs'
import { Context, inflateFile } from '../freemarker'
import { Recipe, Command } from './recipe'

const resolveSourcePath = (sourcePath: string, filePath: string): string => {
  if (filePath.startsWith('/')) {
    return filePath
  } else {
    return path.join(sourcePath, 'root', filePath)
  }
}

const resolveTargetPath = (targetPath: string, filePath: string): string => {
  return path.join(targetPath, filePath)
}

export function resolvePaths(
  sourcePath: string,
  targetPath: string,
  command: Command
): Command {
  switch (command.type) {
    case 'dependency':
      return command
    case 'mkdir':
      return {
        type: command.type,
        value: { at: resolveTargetPath(targetPath, command.value.at) },
      }
    case 'merge':
    case 'instantiate':
    case 'copy':
      return {
        type: command.type,
        value: {
          from: resolveSourcePath(sourcePath, command.value.from),
          to: resolveTargetPath(targetPath, command.value.to),
        },
      }
  }
}

export function executeCommand(
  source: IFS,
  target: IFS,
  command: Command,
  context: Context
): void {
  switch (command.type) {
    case 'dependency':
      const dependencyList = context.get('dependencyList') || []

      if (!dependencyList.includes(command.value)) {
        context.set('dependencyList', [...dependencyList, command.value])
      }

      return
    case 'mkdir':
      try {
        target.mkdirSync(path.join('/', command.value.at), {
          recursive: true,
        })
      } catch {}

      return
    // TODO: AST-aware merge?
    case 'merge': {
      const inflated = inflateFile(source, command.value.from, context)

      const initialText = source.existsSync(command.value.to)
        ? source.readFileSync(command.value.to, 'utf8')
        : ''

      const mergedText = [initialText, inflated]
        .filter(x => x.length > 0)
        .join('\n')

      target.writeFileSync(command.value.to, mergedText)

      return
    }
    case 'instantiate': {
      const inflated = inflateFile(source, command.value.from, context)

      target.mkdirSync(path.dirname(command.value.to), {
        recursive: true,
      })

      target.writeFileSync(command.value.to, inflated, 'utf8')

      return
    }
    case 'copy': {
      copy(fs, target, command.value.from, command.value.to)

      return
    }
  }
}

export function execute(
  source: IFS,
  sourcePath: string,
  targetPath: string,
  recipe: Recipe,
  context: Context
): IFS {
  const { fs: target } = createFs()

  const resolvedCommands = recipe.map(command =>
    resolvePaths(sourcePath, targetPath, command)
  )

  resolvedCommands.forEach(command => {
    executeCommand(source, target, command, context)
  })

  return target
}
