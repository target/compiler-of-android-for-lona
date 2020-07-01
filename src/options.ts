import path from 'path'
import { DEFAULT_VALUE_NAME_TEMPLATE } from './android/valueResources'
import { DEFAULT_DRAWABLE_NAME_TEMPLATE } from './android/drawableResources'

export type Raw = {
  // General
  verbose?: boolean
  // Files
  output?: string
  dryRun?: boolean
  // Android
  packageName?: string
  minSdk?: number
  buildSdk?: number
  targetSdk?: number
  generateGallery?: boolean
  valueResourceNameTemplate?: string
  drawableResourceNameTemplate?: string
  noOverwrite?: string[]
}

export type Validated = {
  verbose: boolean
  shouldOutputFiles: boolean
  outputPath: string
  dryRun: boolean
  packageName: string
  minSdk: number
  buildSdk: number
  targetSdk: number
  generateGallery: boolean
  valueResourceNameTemplate: string
  drawableResourceNameTemplate: string
  noOverwrite: string[]
}

export function validate(
  options: Raw,
  cwd: string
): { type: 'error'; value: string } | { type: 'ok'; value: Validated } {
  if (!options.packageName) {
    return {
      type: 'error',
      value:
        'The --package-name [name] option is required when generating an Android package, e.g. com.lona.my_library',
    }
  }

  const dryRun = typeof options.dryRun === 'boolean' ? options.dryRun : false

  return {
    type: 'ok',
    value: {
      verbose: typeof options.verbose === 'boolean' ? options.verbose : false,
      shouldOutputFiles: !!options.output && !dryRun,
      dryRun,
      outputPath: options.output ? path.resolve(options.output) : cwd,
      packageName: options.packageName,
      minSdk: options.minSdk ?? 21,
      buildSdk: options.buildSdk ?? options.targetSdk ?? 29,
      targetSdk: options.targetSdk ?? options.buildSdk ?? 29,
      generateGallery:
        typeof options.generateGallery === 'boolean'
          ? options.generateGallery
          : false,
      valueResourceNameTemplate:
        typeof options.valueResourceNameTemplate === 'string'
          ? options.valueResourceNameTemplate
          : DEFAULT_VALUE_NAME_TEMPLATE,
      drawableResourceNameTemplate:
        typeof options.drawableResourceNameTemplate === 'string'
          ? options.drawableResourceNameTemplate
          : DEFAULT_DRAWABLE_NAME_TEMPLATE,
      noOverwrite: options.noOverwrite ?? [],
    },
  }
}
