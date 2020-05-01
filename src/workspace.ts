import fs from 'fs'
import path from 'path'
import { IFS } from 'buffs'
import { Helpers } from '@lona/compiler/lib/helpers'
import * as FileSearch from '@lona/compiler/lib/utils/file-search'
import * as Tokens from '@lona/compiler/lib/plugins/tokens'
import { Token } from '@lona/compiler/lib/plugins/tokens/tokens-ast'

import { getConfig, Config } from './lona'
import { createLibraryFiles, createManifest } from './android/library'
import { createBuildScript, DEFAULT_BUILD_CONFIG } from './android/gradle'
import * as Resources from './android/resources'
import * as Color from './tokens/color'
import * as Shadow from './tokens/shadow'
import * as TextStyle from './tokens/textStyle'
import { createFiles as createSvgDrawableFiles } from './svg/drawable'

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

async function convertSvgFiles(
  workspaceConfig: Config,
  workspacePath: string
): Promise<[string, IFS][]> {
  const svgRelativePaths = FileSearch.sync(workspacePath, '**/*.svg', {
    ignore: workspaceConfig.ignore,
  })

  return Promise.all(
    svgRelativePaths.map(async relativePath => {
      const data = await fs.promises.readFile(
        path.join(workspacePath, relativePath)
      )

      const result: [string, IFS] = [
        relativePath,
        await createSvgDrawableFiles(relativePath, data),
      ]

      return result
    })
  )
}

export type ConvertOptions = {
  outputPath: string
  packageName: string
  minSdkVersion: number
  generateAndroidManifest: boolean
  generateBuildScript: boolean
}

/**
 * Convert a Lona workspace to an Android library module.
 *
 * @returns A filesystem containing the generated library files.
 */
export async function convert(
  workspacePath: string,
  helpers: Helpers,
  options: ConvertOptions
): Promise<IFS> {
  const {
    outputPath,
    packageName,
    minSdkVersion,
    generateAndroidManifest,
    generateBuildScript,
  } = options

  let convertedWorkspace: Tokens.ConvertedWorkspace

  try {
    const converted = await Tokens.parseWorkspace(workspacePath, helpers, {
      output: false,
    })

    if (!converted) {
      return Promise.reject('Problem')
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

  const vectorDrawables: [string, IFS][] = await convertSvgFiles(
    workspaceConfig,
    workspacePath
  )

  return createLibraryFiles(outputPath, {
    packageName,
    buildScript: generateBuildScript
      ? createBuildScript(DEFAULT_BUILD_CONFIG)
      : undefined,
    androidManifest: generateAndroidManifest
      ? createManifest(packageName)
      : undefined,
    colorResources: tokens ? createColorsResourceFile(tokens) : undefined,
    elevationResources: tokens ? createShadowsResourceFile(tokens) : undefined,
    textStyleResources: tokens
      ? createTextStyleResourceFile(tokens, { minSdkVersion })
      : undefined,
    drawableResources: vectorDrawables,
  }).fs
}
