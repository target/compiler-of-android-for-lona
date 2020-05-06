import fs from 'fs'
import path from 'path'
import { createFs, IFS, copy } from 'buffs'
import * as XML from '../xml'
import * as FreeMarker from '../freemarker'

import { Config, getConfig } from './config'
import { parse as parseRecipe, Recipe } from './recipe'
import { parse as parseGlobals, Globals } from './globals'

type CreateContextOptions = { packageName: string }

function createFreemarkerContext(
  { packageName }: CreateContextOptions,
  globals: Globals = {}
): FreeMarker.Context {
  const projectParts = packageName.split('.')
  const projectName = projectParts[projectParts.length - 1]
  const projectPrefix = projectName || '.'

  return FreeMarker.createContext({
    ...globals,
    topOut: '.',
    projectOut: `./${projectPrefix}`,
    srcDir: `./${projectPrefix}/src`,
    manifestDir: `./${projectPrefix}/src/main`,
    resDir: `./${projectPrefix}/src/main/res`,
    repositoryList: ['google()', 'jcenter()'],
    baseTheme: 'none',
    makeIgnore: true,
    createActivity: false,
    sdkDir: process.env.ANDROID_HOME,
    appTitle: projectName,
    projectName: projectName,
    simpleName: projectName,
    buildApi: 29,
    buildApiString: '29',
    buildToolsVersion: '29.0.2',
    packageName: packageName,
    WearprojectName: '',
    minApi: '21',
    minApiLevel: 21,
    targetApi: 29,
    targetApiString: '29',
    gradlePluginVersion: '3.6.0+',
    javaVersion: '1.7',
    enableProGuard: false,
    dependencyList: undefined,
    unitTestsSupported: false,
    assetName: undefined,
    mavenUrl: 'mavenCentral',
    isLibraryProject: true,
    copyIcons: false,
    appCompat: false,
    perModuleRepositories: undefined,
    templateRoot: path.join(__dirname, '../../templates/android-studio'),
    escapeXmlAttribute: (value: string) => value,
    escapeXmlString: (value: string) => value,
    escapePropertyValue: (value: string) => value,
    hasDependency: (value: string) => false,
    slashedPackageName: (packageName: string): string =>
      packageName.replace(/\./g, '/'),
    compareVersions: (a: string, b: string): boolean => false,
  })
}

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
  options: CreateContextOptions
): IFS {
  const templatePath = path.join(sourcePath, 'template.xml')

  // console.warn('inflating:', templatePath)

  const template = readTemplate(source, templatePath)

  const { globals: globalsName, execute: recipeName } = template

  const globalsPath = path.join(sourcePath, globalsName)

  // console.warn('INFO: reading globals:', globalsPath)

  const globals = readGlobals(
    source,
    globalsPath,
    createFreemarkerContext(options)
  )

  // console.log('INFO: globals', util.inspect(globals, false, null, true))

  const recipePath = path.join(sourcePath, recipeName)

  const sharedContext = createFreemarkerContext(options, globals)

  // console.warn('INFO: reading recipe:', recipePath)

  const recipe = readRecipe(source, recipePath, sharedContext)

  // console.log('recipe', util.inspect(recipe, false, null, true))

  // console.warn('INFO: executing recipe:', recipePath)

  const target = execute(source, sourcePath, targetPath, recipe, sharedContext)

  return target

  // return createFs().fs
}
