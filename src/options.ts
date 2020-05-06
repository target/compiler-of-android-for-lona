import { templatePathForName, BuiltInTemplateNames } from './template/builtins'

export type Raw = {
  // Files
  output?: string
  dryRun?: boolean
  // Android
  template?: string
  packageName?: string
  minSdkVersion?: number
  generateAndroidManifest?: boolean
  generateBuildScript?: boolean
  generateGallery?: boolean
}

export type Validated = {
  template: BuiltInTemplateNames
  shouldOutputFiles: boolean
  outputPath: string
  dryRun: boolean
  packageName: string
  minSdkVersion: number
  generateAndroidManifest: boolean
  generateBuildScript: boolean
  generateGallery: boolean
}

export function validate(
  options: Raw,
  cwd: string
): { type: 'error'; value: string } | { type: 'ok'; value: Validated } {
  if (
    !options.template ||
    (options.template !== 'project' && options.template !== 'module')
  ) {
    return {
      type: 'error',
      value:
        'The --template [name] option is required. Use "project" or "module"',
    }
  }

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
      template: options.template,
      shouldOutputFiles: !!options.output && !dryRun,
      dryRun,
      outputPath: options.output || cwd,
      packageName: options.packageName,
      minSdkVersion: options.minSdkVersion || 21,
      generateAndroidManifest:
        typeof options.generateAndroidManifest === 'boolean'
          ? options.generateAndroidManifest
          : true,
      generateBuildScript:
        typeof options.generateBuildScript === 'boolean'
          ? options.generateBuildScript
          : true,
      generateGallery:
        typeof options.generateGallery === 'boolean'
          ? options.generateGallery
          : false,
    },
  }
}
