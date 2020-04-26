import fs from 'fs'
import path from 'path'
import { Plugin } from '@lona/compiler/lib/plugins'
import { Helpers } from '@lona/compiler/lib/helpers'
import * as FileSearch from '@lona/compiler/lib/utils/file-search'
import * as Tokens from '@lona/compiler/lib/plugins/tokens'
import { Token } from '@lona/compiler/lib/plugins/tokens/tokens-ast'
import { describeComparison, copy } from 'buffs'

import { getConfig } from './lona'
import { createLibraryFiles, createManifest } from './android/library'
import { createBuildScript, DEFAULT_BUILD_CONFIG } from './android/gradle'
import * as Resources from './android/resources'
import * as Color from './tokens/color'
import * as Shadow from './tokens/shadow'
import * as TextStyle from './tokens/textStyle'
import * as SVG from './svg/index'

async function parseFile(
  filePath: string,
  helpers: Helpers,
  options: {
    [argName: string]: unknown
  }
): Promise<void> {
  return Promise.reject('Not implemented')
}

function createColorsResourceFile(tokens: Token[]) {
  const colors: Color.Token[] = tokens.flatMap(({ qualifiedName, value }) =>
    value.type === 'color'
      ? [{ qualifiedName: qualifiedName, value: value.value }]
      : []
  )

  return Resources.createFile(
    colors
      .map(Color.convert)
      .map(element => ({ type: 'element', data: element }))
  )
}

function createShadowsResourceFile(tokens: Token[]) {
  const shadows: Shadow.Token[] = tokens.flatMap(({ qualifiedName, value }) =>
    value.type === 'shadow'
      ? [{ qualifiedName: qualifiedName, value: value.value }]
      : []
  )

  return Resources.createFile(
    shadows
      .map(Shadow.convert)
      .map(element => ({ type: 'element', data: element }))
  )
}

function createTextStyleResourceFile(
  tokens: Token[],
  options: TextStyle.Options
) {
  const textStyles: TextStyle.Token[] = tokens.flatMap(
    ({ qualifiedName, value }) =>
      value.type === 'textStyle'
        ? [{ qualifiedName: qualifiedName, value: value.value }]
        : []
  )

  return Resources.createFile(
    textStyles
      .map(textStyle => TextStyle.convert(textStyle, options))
      .map(element => ({ type: 'element', data: element }))
  )
}

async function parseWorkspace(
  workspacePath: string,
  helpers: Helpers,
  options: {
    // Files
    output?: string
    dryRun?: boolean
    // Android
    packageName?: string
    minSdkVersion?: number
  }
): Promise<void> {
  if (!options.packageName) {
    return Promise.reject(
      'The --package-name [name] option is required when generating an Android package, e.g. com.lona.my_library'
    )
  }

  const packageName = options.packageName
  const minSdkVersion = options.minSdkVersion || 21

  let convertedWorkspace: Tokens.ConvertedWorkspace

  try {
    const converted = await Tokens.parseWorkspace(workspacePath, helpers, {
      output: false,
    })

    if (!converted) {
      Promise.reject('Problem')
      return
    }

    convertedWorkspace = converted
  } catch (error) {
    console.log('Failed to convert tokens')
    return Promise.reject(error)
  }

  const tokens = convertedWorkspace.files.flatMap(file =>
    file.contents.type === 'flatTokens' ? file.contents.value : []
  )

  const workspaceConfig = await getConfig(workspacePath)

  const svgRelativePaths = FileSearch.sync(workspacePath, '**/*.svg', {
    ignore: workspaceConfig.ignore,
  })

  const vectorDrawables: [string, string][] = svgRelativePaths.map(
    relativePath => {
      return [
        relativePath.replace(/.svg$/, '.xml'),
        SVG.convertFile(path.join(workspacePath, relativePath)),
      ]
    }
  )

  const outputPath = options.output || process.cwd()

  const { fs: source } = createLibraryFiles(outputPath, {
    buildScript: createBuildScript(DEFAULT_BUILD_CONFIG),
    androidManifest: createManifest(packageName),
    colorResources: tokens ? createColorsResourceFile(tokens) : undefined,
    elevationResources: tokens ? createShadowsResourceFile(tokens) : undefined,
    textStyleResources: tokens
      ? createTextStyleResourceFile(tokens, { minSdkVersion })
      : undefined,
    drawableResources: vectorDrawables,
  })

  if (options.output && !options.dryRun) {
    copy(source, fs, options.output)
  } else {
    console.error('\nThe following files will be generated:\n')

    const description = describeComparison(source, fs, outputPath, {
      colorize: true,
    })

    console.error(description)

    if (!options.output) {
      console.error(
        '\nUse the --ouput [path] option to specify the output directory.\n'
      )
    }
  }
}

const plugin: Plugin = {
  format: 'android',
  parseFile,
  parseWorkspace,
}

export default plugin
