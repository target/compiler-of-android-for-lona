import fs from 'fs'
import path from 'path'
import { createFs, IFS, copy } from 'buffs'
import * as XML from '../xml'
import * as FreeMarker from '../freemarker'

import { Config, getConfig } from './config'
import { parse as parseRecipe, Recipe } from './recipe'
import { parse as parseGlobals, Globals } from './globals'

function inflateFMT(
  source: IFS,
  filePath: string,
  context: FreeMarker.Context
): string {
  const data = source.readFileSync(filePath, 'utf8')
  const template = FreeMarker.parse(data)
  if (template.ast.errors) {
    console.log('ERROR: Failed to parse', filePath)
  }
  const inflated = FreeMarker.evaluate(template.ast, context)
  return inflated
}

function readXML(source: IFS, filePath: string): XML.Element {
  const templateString = source.readFileSync(filePath, 'utf8')
  return XML.parse(templateString)
}

function readTemplate(source: IFS, templatePath: string): Config {
  const templateElement = readXML(source, templatePath)
  return getConfig(templateElement)
}

function readRecipe(
  source: IFS,
  recipePath: string,
  context: FreeMarker.Context
): Recipe {
  const inflated = inflateFMT(source, recipePath, context)
  const xml = XML.parse(inflated)
  return parseRecipe(xml)
}

function readGlobals(
  source: IFS,
  globalsPath: string,
  context: FreeMarker.Context
): Globals {
  const inflated = inflateFMT(source, globalsPath, context)
  const xml = XML.parse(inflated)
  return parseGlobals(xml)
}

function execute(
  source: IFS,
  sourcePath: string,
  targetPath: string,
  recipe: Recipe,
  context: FreeMarker.Context
): IFS {
  const { fs: target } = createFs()

  const resolveSourcePath = (filePath: string): string => {
    if (filePath.startsWith('/')) {
      return filePath
    } else {
      return path.join(sourcePath, 'root', filePath)
    }
  }

  const resolveTargetPath = (filePath: string): string => {
    return path.join(targetPath, filePath)
  }

  for (const command of recipe) {
    switch (command.type) {
      case 'dependency':
        const dependencyList = context.get('dependencyList') || []

        if (!dependencyList.includes(command.value)) {
          context.set('dependencyList', [...dependencyList, command.value])
        }

        // console.log('dep', command)
        break
      case 'mkdir':
        // if (!command.value.at) break
        try {
          target.mkdirSync(
            path.join('/', resolveTargetPath(command.value.at)),
            {
              recursive: true,
            }
          )
        } catch {}
        break
      // TODO: Smarter merge
      case 'merge': {
        // console.log('should merge', command.value)

        const mergeSourcePath = resolveSourcePath(command.value.from)
        const mergeTargetPath = resolveTargetPath(command.value.to)

        // console.log('source', mergeSourcePath, 'target', mergeTargetPath)

        const inflated = inflateFMT(source, mergeSourcePath, context)

        const initialText = source.existsSync(mergeTargetPath)
          ? source.readFileSync(mergeTargetPath, 'utf8')
          : ''

        const mergedText = [initialText, inflated]
          .filter(x => x.length > 0)
          .join('\n')

        target.writeFileSync(mergeTargetPath, mergedText)

        break
      }
      case 'instantiate': {
        const inflated = inflateFMT(
          source,
          resolveSourcePath(command.value.from),
          context
        )
        target.mkdirSync(path.dirname(resolveTargetPath(command.value.to)), {
          recursive: true,
        })
        target.writeFileSync(
          resolveTargetPath(command.value.to),
          inflated,
          'utf8'
        )
        break
      }
      case 'copy': {
        // console.log(
        //   'INFO: Copy',
        //   command.value,
        //   resolveSourcePath(command.value.from),
        //   resolveTargetPath(command.value.to)
        // )
        copy(
          fs,
          target,
          resolveSourcePath(command.value.from),
          resolveTargetPath(command.value.to)
        )
        break
      }
    }
  }

  // const inspected = util.inspect(volume.toJSON(), false, null, true)
  // console.log(inspected)

  return target
}

export function inflate(
  source: IFS,
  sourcePath: string,
  targetPath: string,
  initialContext: FreeMarker.Context
): { files: IFS; context: FreeMarker.Context } {
  const templatePath = path.join(sourcePath, 'template.xml')

  // console.warn('inflating:', templatePath)

  const template = readTemplate(source, templatePath)

  const { globals: globalsName, execute: recipeName } = template

  const globalsPath = path.join(sourcePath, globalsName)

  // console.warn('INFO: reading globals:', globalsPath)

  const globals = readGlobals(source, globalsPath, initialContext)

  // console.log('INFO: globals', util.inspect(globals, false, null, true))

  const recipePath = path.join(sourcePath, recipeName)

  const sharedContext = initialContext.withDefaults(globals)

  // console.warn('INFO: reading recipe:', recipePath)

  const recipe = readRecipe(source, recipePath, sharedContext)

  // console.log('recipe', util.inspect(recipe, false, null, true))

  // console.warn('INFO: executing recipe:', recipePath)

  const target = execute(source, sourcePath, targetPath, recipe, sharedContext)

  return { files: target, context: sharedContext }

  // return createFs().fs
}
