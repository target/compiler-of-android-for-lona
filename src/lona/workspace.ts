import { Helpers } from '@lona/compiler/lib/helpers'
import * as Tokens from '@lona/compiler/lib/plugins/tokens'
import { Token } from '@lona/compiler/lib/plugins/tokens/tokens-ast'
import * as FileSearch from '@lona/compiler/lib/utils/file-search'
import { copy, IFS } from 'buffs'
import fs from 'fs'
import path from 'path'
import { Union } from 'unionfs'
import util from 'util'
import {
  addDependenciesAndPluginsToModuleBuildScript,
  addKotlinDependencyToRootBuildScript,
} from '../android/buildScript'
import { formatDrawableName } from '../android/drawableResources'
import { createResourceFiles } from '../android/resources'
import { Validated } from '../options'
import { createFiles as createSvgDrawableFiles } from '../svg/drawable'
import { templatePathForName } from '../template/bundled'
import {
  createTemplateContext,
  CreateTemplateContextOptions,
} from '../template/context'
import { inflate, InflateOptions } from '../template/inflate'
import { createValueResources } from './tokens'

export function inflateProjectTemplate(
  outputPath: string,
  generateGallery: boolean,
  drawableResourceNames: string[],
  options: CreateTemplateContextOptions,
  inflateOptions?: InflateOptions
): { files: IFS; srcPath: string; resPath: string } {
  const { files: projectFiles } = inflate(
    fs,
    templatePathForName('project'),
    outputPath,
    createTemplateContext(options),
    inflateOptions
  )

  const fsAndProject = new Union()
  fsAndProject.use(fs)
  fsAndProject.use(projectFiles)

  const { files: moduleFiles, context: moduleContext } = inflate(
    fsAndProject,
    templatePathForName('module'),
    outputPath,
    createTemplateContext(options),
    inflateOptions
  )

  copy(moduleFiles, projectFiles, '/', '/')

  if (generateGallery) {
    const { files: galleryFiles, context: galleryContext } = inflate(
      fsAndProject,
      templatePathForName('gallery'),
      outputPath,
      createTemplateContext({
        ...options,
        overrides: {
          isNewProject: false,
          layoutName: 'activity_empty',
          activityClass: 'EmptyActivity',
          activityTitle: 'Empty Activity',
          isLauncher: false,
          relativePackage: undefined,
          drawableAssetList: drawableResourceNames,
        },
      }),
      inflateOptions
    )

    addKotlinDependencyToRootBuildScript(
      projectFiles,
      galleryContext,
      outputPath
    )
    addDependenciesAndPluginsToModuleBuildScript(
      projectFiles,
      galleryContext,
      outputPath
    )

    copy(galleryFiles, projectFiles, '/', '/')
  }

  return {
    files: projectFiles,
    srcPath: moduleContext.get('srcDir'),
    resPath: moduleContext.get('resDir'),
  }
}

async function convertTokens(workspacePath: string, helpers: Helpers) {
  const convertedWorkspace = await Tokens.parseWorkspace(
    workspacePath,
    helpers,
    {
      output: false,
    }
  )

  if (!convertedWorkspace) {
    return Promise.reject('Unknown problem while converting tokens')
  }

  const tokens = convertedWorkspace.files.flatMap(file =>
    file.contents.type === 'flatTokens' ? file.contents.value : []
  )

  return tokens
}

async function convertSvgFiles(
  workspacePath: string,
  nameTemplate: string,
  ignore: string[]
): Promise<[string, IFS][]> {
  const svgRelativePaths = FileSearch.sync(workspacePath, '**/*.svg', {
    ignore,
  })

  return Promise.all(
    svgRelativePaths.map(async relativePath => {
      const data = await fs.promises.readFile(
        path.join(workspacePath, relativePath)
      )

      const result: [string, IFS] = [
        relativePath,
        await createSvgDrawableFiles(relativePath, data, { nameTemplate }),
      ]

      return result
    })
  )
}

/**
 * Convert a Lona workspace to an Android library module.
 *
 * @returns A filesystem containing the generated library files.
 */
export async function convert(
  workspacePath: string,
  helpers: Helpers,
  options: Omit<Validated, 'shouldOutputFiles' | 'dryRun'>
): Promise<IFS> {
  const {
    verbose,
    outputPath,
    packageName,
    minSdk,
    buildSdk,
    targetSdk,
    generateGallery,
    valueResourceNameTemplate,
    drawableResourceNameTemplate,
  } = options

  if (verbose) {
    console.log('Converting with options:')
    console.log(util.inspect(options, false, null, true))
  }

  let tokens: Token[]

  try {
    tokens = await convertTokens(workspacePath, helpers)
  } catch (error) {
    helpers.reporter.error('Failed to convert tokens')
    return Promise.reject(error)
  }

  const drawableResources: [string, IFS][] = await convertSvgFiles(
    workspacePath,
    valueResourceNameTemplate,
    helpers.config.ignore
  )

  const drawableResourceNames = drawableResources.map(([key]) =>
    formatDrawableName(key, undefined, {
      nameTemplate: drawableResourceNameTemplate,
    })
  )

  const { files: templateFiles, resPath } = inflateProjectTemplate(
    outputPath,
    generateGallery,
    drawableResourceNames,
    { packageName, minSdk, buildSdk, targetSdk },
    { verbose }
  )

  const valueResources = createValueResources(tokens, {
    minSdk,
    nameTemplate: drawableResourceNameTemplate,
  })

  const { fs: resourceFiles } = createResourceFiles(
    path.join(outputPath, resPath),
    {
      colorResources: valueResources.colors,
      elevationResources: valueResources.elevations,
      textStyleResources: valueResources.textStyles,
      drawableResources,
    }
  )

  copy(resourceFiles, templateFiles, '/', '/')

  return templateFiles
}
