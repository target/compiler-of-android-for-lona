import fs from 'fs'
import path from 'path'
import { createFs, IFS, copy } from 'buffs'
import { Context, inflateFile } from '../freemarker'
import { Recipe, Command } from './recipe'
import { isManifestPath, mergeManifests } from '../android/manifest'
import {
  isValueResourcePath,
  mergeValueResourceFiles,
} from '../android/valueResources'

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
    case 'open':
      return {
        type: command.type,
        value: {
          file: resolveTargetPath(targetPath, command.value.file),
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
  function ensureTargetDirectory(to: string) {
    const dirname = path.dirname(to)
    try {
      target.mkdirSync(dirname, { recursive: true })
    } catch {
      console.warn(`Failed to create ${dirname} while executing recipe`)
    }
  }

  switch (command.type) {
    case 'dependency':
      const dependencyList = context.get('dependencyList') || []

      if (!dependencyList.includes(command.value)) {
        context.set('dependencyList', [...dependencyList, command.value.url])
      }

      return
    case 'mkdir':
      try {
        target.mkdirSync(path.join('/', command.value.at), {
          recursive: true,
        })
      } catch {}

      return
    case 'merge': {
      const { from, to } = command.value

      ensureTargetDirectory(to)

      const inflated = inflateFile(source, from, context)

      if (source.existsSync(to)) {
        const initialText = source.readFileSync(to, 'utf8')

        if (isManifestPath(from)) {
          // console.log('manifest', from, to, initialText, inflated)
          target.writeFileSync(to, mergeManifests(initialText, inflated))
        } else if (isValueResourcePath(from)) {
          target.writeFileSync(
            to,
            mergeValueResourceFiles(initialText, inflated)
          )
        } else {
          const mergedText = [initialText, inflated]
            .filter(x => x.length > 0)
            .join('\n')
          target.writeFileSync(to, mergedText)
        }
      } else {
        target.writeFileSync(to, inflated)
      }

      return
    }
    case 'instantiate': {
      ensureTargetDirectory(command.value.to)

      const inflated = inflateFile(source, command.value.from, context)

      target.writeFileSync(command.value.to, inflated, 'utf8')

      return
    }
    case 'copy': {
      ensureTargetDirectory(command.value.to)

      copy(fs, target, command.value.from, command.value.to)

      return
    }
    // This command presumably opens the file in an Android Studio window,
    // which we don't need to do
    case 'open':
      return
  }
}

export function execute(
  source: IFS,
  sourcePath: string,
  targetPath: string,
  recipe: Recipe,
  context: Context
): IFS {
  const target = createFs()

  const resolvedCommands = recipe.map(command =>
    resolvePaths(sourcePath, targetPath, command)
  )

  resolvedCommands.forEach(command => {
    executeCommand(source, target, command, context)
  })

  return target
}
