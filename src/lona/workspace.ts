import fs from 'fs'
import path from 'path'
import { Union } from 'unionfs'
import { IFS, createFs, copy, describe } from 'buffs'
import { Helpers } from '@lona/compiler/lib/helpers'
import * as FileSearch from '@lona/compiler/lib/utils/file-search'
import * as Tokens from '@lona/compiler/lib/plugins/tokens'
import { Token } from '@lona/compiler/lib/plugins/tokens/tokens-ast'

import { getConfig, Config } from './config'
import { createLibraryFiles, createManifest } from '../android/library'
import { createBuildScript, DEFAULT_BUILD_CONFIG } from '../android/gradle'
import * as Resources from '../android/resources'
import * as Color from './color'
import * as Shadow from './shadow'
import * as TextStyle from './textStyle'
import { createFiles as createSvgDrawableFiles } from '../svg/drawable'
import { templatePathForName, BuiltInTemplateNames } from '../template/builtins'
import { inflate } from '../template/inflate'

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

export function inflateTemplate(
  templateName: BuiltInTemplateNames,
  packageName: string,
  outputPath: string
): { files: IFS; srcPath: string } {
  switch (templateName) {
    case 'module':
      return {
        files: inflate(fs, templatePathForName('module'), outputPath, {
          packageName,
        }),
        srcPath: 'designlibrary/src',
      }

    case 'project':
      const projectFiles = inflate(
        fs,
        templatePathForName('project'),
        outputPath,
        {
          packageName,
        }
      )

      const fsAndProject = new Union()
      fsAndProject.use(fs)
      fsAndProject.use(projectFiles)

      const moduleFiles = inflate(
        fsAndProject,
        templatePathForName('module'),
        outputPath,
        {
          packageName,
        }
      )

      copy(moduleFiles, projectFiles, '/', '/')

      return { files: projectFiles, srcPath: 'designlibrary/src' }
  }
}

export type ConvertOptions = {
  template: BuiltInTemplateNames
  outputPath: string
  packageName: string
  minSdkVersion: number
  generateAndroidManifest: boolean
  generateBuildScript: boolean
  generateGallery: boolean
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
    template,
    outputPath,
    packageName,
    minSdkVersion,
    generateAndroidManifest,
    generateBuildScript,
    generateGallery,
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

  const { files: templateFiles, srcPath } = inflateTemplate(
    template,
    packageName,
    outputPath
  )

  const libraryFiles = createLibraryFiles(path.join(outputPath, srcPath), {
    packageName,
    buildScript: generateBuildScript
      ? createBuildScript(DEFAULT_BUILD_CONFIG)
      : undefined,
    androidManifest: generateAndroidManifest
      ? createManifest(packageName)
      : undefined,
    generateGallery,
    colorResources: tokens ? createColorsResourceFile(tokens) : undefined,
    elevationResources: tokens ? createShadowsResourceFile(tokens) : undefined,
    textStyleResources: tokens
      ? createTextStyleResourceFile(tokens, { minSdkVersion })
      : undefined,
    drawableResources: vectorDrawables,
  }).fs

  copy(libraryFiles, templateFiles, '/', '/')

  return templateFiles
}
