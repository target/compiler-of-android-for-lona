import fs from 'fs'
import path from 'path'
import util from 'util'
import { createFs, IFS, copy } from 'buffs'
import * as XML from '../xml'
import * as FreeMarker from '../freemarker'

import { Config, getConfig } from './config'
import { parse as parseRecipe, Recipe } from './recipe'
import { parse as parseGlobals, Globals } from './globals'

type CreateContextOptions = { projectName?: string }

function createFreemarkerContext(
  options: CreateContextOptions,
  globals: Globals = {}
): FreeMarker.Context {
  const projectPrefix = options.projectName || '.'

  return {
    data: {
      ...globals,
      topOut: '.',
      projectOut: `./${projectPrefix}`,
      srcDir: `./${projectPrefix}/src`,
      manifestDir: `./${projectPrefix}/src/main`,
      resDir: `./${projectPrefix}/src/main/res`,
      baseTheme: 'none',
      makeIgnore: true,
      createActivity: false,
      sdkDir: process.env.ANDROID_HOME,
      appTitle: 'designsystem',
      projectName: 'designsystem',
      simpleName: 'DesignSystem',
      buildApi: 29,
      buildApiString: '29.0.2',
      buildToolsVersion: '29.0.2',
      packageName: 'com.lona.designsystem',
      WearprojectName: '',
      minApi: '21',
      minApiLevel: 21,
      targetApi: 29,
      targetApiString: '29',
      gradlePluginVersion: '1.0.+',
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
    },
  }
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

async function execute(
  source: IFS,
  directoryPath: string,
  recipe: Recipe,
  context: FreeMarker.Context
): Promise<IFS> {
  const { fs: target, volume } = createFs()

  const resolveSourcePath = (filePath: string): string => {
    if (filePath.startsWith('/')) {
      return filePath
    } else {
      return path.join(directoryPath, 'root', filePath)
    }
  }

  const resolveTargetPath = (filePath: string): string => {
    // if (filePath.startsWith('./') || filePath.startsWith('../')) {
    //   return path.join('/', filePath)
    // }
    return path.join('/', filePath)
  }

  for (const command of recipe) {
    switch (command.type) {
      case 'dependency':
        context.data.dependencyList = context.data.dependencyList || []

        if (!context.data.dependencyList.includes(command.value)) {
          context.data.dependencyList.push(command.value)
        }

        console.log('dep', command)
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
      case 'merge': // TODO: Actually merge files
        console.log('should merge', command.value)
        break
      case 'instantiate':
        const inflated = await inflateFMT(
          source,
          resolveSourcePath(command.value.from),
          context
        )
        // console.log('inflated', inflated, command)
        target.mkdirSync(path.dirname(resolveTargetPath(command.value.to)), {
          recursive: true,
        })
        target.writeFileSync(
          resolveTargetPath(command.value.to),
          inflated,
          'utf8'
        )
        break
      case 'copy':
        console.log(
          'INFO: Copy',
          command.value,
          resolveSourcePath(command.value.from),
          resolveTargetPath(command.value.to)
        )
        copy(
          fs,
          target,
          resolveSourcePath(command.value.from),
          resolveTargetPath(command.value.to)
        )
        break
    }
  }

  // const inspected = util.inspect(volume.toJSON(), false, null, true)
  // console.log(inspected)

  return target
}

export async function inflate(
  source: IFS,
  sourcePath: string,
  options: { projectName?: string }
): Promise<IFS> {
  const templatePath = path.join(sourcePath, 'template.xml')

  console.warn('inflating:', templatePath)

  const template = await readTemplate(source, templatePath)

  const { globals: globalsName, execute: recipeName } = template

  const globalsPath = path.join(sourcePath, globalsName)

  // console.warn('INFO: reading globals:', globalsPath)

  const globals = await readGlobals(
    source,
    globalsPath,
    createFreemarkerContext(options)
  )

  // console.log('INFO: globals', util.inspect(globals, false, null, true))

  const recipePath = path.join(sourcePath, recipeName)

  const sharedContext = createFreemarkerContext(options, globals)

  // console.warn('INFO: reading recipe:', recipePath)

  const recipe = await readRecipe(source, recipePath, sharedContext)

  // console.log('recipe', util.inspect(recipe, false, null, true))

  // console.warn('INFO: executing recipe:', recipePath)

  const target = await execute(source, sourcePath, recipe, sharedContext)

  return target

  // return createFs().fs
}
