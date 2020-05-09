import fs from 'fs'
import path from 'path'
import util from 'util'
import { Union } from 'unionfs'
import { IFS, copy } from 'buffs'
import { Helpers } from '@lona/compiler/lib/helpers'
import * as FileSearch from '@lona/compiler/lib/utils/file-search'
import * as Tokens from '@lona/compiler/lib/plugins/tokens'

import { createResourceFiles } from '../android/resources'
import { createFiles as createSvgDrawableFiles } from '../svg/drawable'
import { templatePathForName } from '../template/bundled'
import { inflate, InflateOptions } from '../template/inflate'
import {
  createTemplateContext,
  CreateTemplateContextOptions,
} from '../template/context'
import { createGalleryFiles } from '../android/gallery'
import { createValueResources } from './tokens'
import { Token } from '@lona/compiler/lib/plugins/tokens/tokens-ast'
import { Validated } from '../options'
import { formatDrawableName } from '../android/drawableResources'

export function inflateProjectTemplate(
  outputPath: string,
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

  const { files: templateFiles, srcPath, resPath } = inflateProjectTemplate(
    outputPath,
    { packageName, minSdk, buildSdk, targetSdk },
    { verbose }
  )

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

  if (drawableResources.length > 0 && generateGallery) {
    const classPath = path.join(
      srcPath,
      'main/java',
      packageName.replace(/[.]/g, '/')
    )

    const gallery = createGalleryFiles(
      packageName,
      drawableResources.map(([key]) =>
        formatDrawableName(key, undefined, {
          nameTemplate: drawableResourceNameTemplate,
        })
      )
    )
    copy(gallery, templateFiles, '/', path.join(srcPath, classPath))
  }

  return templateFiles
}
