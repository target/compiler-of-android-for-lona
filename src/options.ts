export type Raw = {
  // Files
  output?: string
  dryRun?: boolean
  // Android
  packageName?: string
  minSdkVersion?: number
  generateAndroidManifest?: boolean
  generateBuildScript?: boolean
}

export type Validated = {
  shouldOutputFiles: boolean
  outputPath: string
  dryRun: boolean
  packageName: string
  minSdkVersion: number
  generateAndroidManifest: boolean
  generateBuildScript: boolean
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
    },
  }
}
