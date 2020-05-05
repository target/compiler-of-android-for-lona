import fs from 'fs'
import path from 'path'
import util from 'util'
import { createFs, IFS, copy } from 'buffs'
import * as XML from '../xml'
import * as FreeMarker from '../freemarker'

import { Config, getConfig } from './config'
import * as Recipe from './recipe'
import { GlobalVariableDefinition, getGlobals } from './globals'

type Globals = { [key: string]: string }

async function readXML(filePath: string): Promise<XML.Element> {
  const templateString = await fs.promises.readFile(filePath, 'utf8')
  return XML.parse(templateString)
}

async function readTemplate(templatePath: string): Promise<Config> {
  const templateElement = await readXML(templatePath)
  return getConfig(templateElement)
}

function createFreemarkerContext(globals: Globals = {}): FreeMarker.Context {
  return {
    data: {
      topOut: '.',
      projectOut: '.',
      srcDir: './src',
      manifestDir: './src/main',
      resDir: './src/main/res',
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
      ...globals,
    },
  }
}

async function inflateFMT(
  filePath: string,
  context: FreeMarker.Context
): Promise<string> {
  const data = await fs.promises.readFile(filePath, 'utf8')
  const template = FreeMarker.parse(data)
  const inflated = FreeMarker.evaluate(template.ast, context)
  return inflated
}

async function readRecipe(
  recipePath: string,
  context: FreeMarker.Context
): Promise<Recipe.Recipe> {
  const inflated = await inflateFMT(recipePath, context)
  const xml = XML.parse(inflated)
  return Recipe.parse(xml)
}

async function readGlobals(
  globalsPath: string,
  context: FreeMarker.Context
): Promise<Globals> {
  const inflated = await inflateFMT(globalsPath, context)
  const xml = XML.parse(inflated)
  return getGlobals(xml).reduce(
    (result: Globals, item: GlobalVariableDefinition) => {
      result[item.id] = item.value
      return result
    },
    {}
  )
}

async function execute(
  directoryPath: string,
  recipe: Recipe.Recipe,
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
          await target.promises.mkdir(path.join('/', command.value.at))
        } catch {}
        break
      case 'merge': // TODO: Actually merge files
      case 'instantiate':
        const inflated = await inflateFMT(
          resolveSourcePath(command.value.from),
          context
        )
        // console.log('inflated', inflated, command)
        target.mkdirSync(path.dirname(command.value.to), { recursive: true })
        target.writeFileSync(command.value.to, inflated, 'utf8')
        break
      case 'copy':
        copy(
          fs,
          target,
          resolveSourcePath(command.value.from),
          command.value.to
        )
        break
    }
  }

  // const inspected = util.inspect(volume.toJSON(), false, null, true)
  // console.log(inspected)

  return target
}

export async function inflate(templatePath: string): Promise<IFS> {
  const directoryPath = path.dirname(templatePath)

  const template = await readTemplate(templatePath)

  const { globals: globalsName, execute: recipeName } = template

  const globalsPath = path.join(directoryPath, globalsName)
  const globals = await readGlobals(globalsPath, createFreemarkerContext())

  // console.log('globals', globals)

  const recipePath = path.join(directoryPath, recipeName)

  const sharedContext = createFreemarkerContext(globals)
  const recipe = await readRecipe(recipePath, sharedContext)

  const inspected = util.inspect(recipe, false, null, true)
  // console.log('inspect', inspected)

  const target = await execute(directoryPath, recipe, sharedContext)
  return target

  // return createFs().fs
}
