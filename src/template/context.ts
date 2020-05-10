import path from 'path'
import { Context, ContextData } from '../freemarker'
import escape from 'lodash.escape'
import snakeCase from 'lodash.snakecase'

export type CreateTemplateContextOptions = {
  packageName: string
  minSdk: number
  targetSdk: number
  buildSdk: number
  overrides?: ContextData
}

export function createTemplateContext({
  packageName,
  minSdk,
  targetSdk,
  buildSdk,
  overrides,
}: CreateTemplateContextOptions): Context {
  const projectParts = packageName.split('.')
  const projectName = projectParts[projectParts.length - 1]
  const projectPrefix = projectName || '.'

  return new Context({
    topOut: '.',
    projectOut: `./${projectPrefix}`,
    srcDir: `./${projectPrefix}/src`,
    manifestDir: `./${projectPrefix}/src/main`,
    resDir: `./${projectPrefix}/src/main/res`,
    repositoryList: ['google()', 'jcenter()'],
    baseTheme: 'none',
    makeIgnore: true,
    createActivity: false,
    sdkDir: process.env.ANDROID_HOME,
    appTitle: projectName,
    projectName: projectName,
    simpleName: projectName,
    buildApi: buildSdk,
    buildApiString: `${buildSdk}`,
    buildToolsVersion: `${buildSdk}`, // TODO: Should this be 29.0.0?
    packageName: packageName,
    WearprojectName: '',
    minApi: `${minSdk}`,
    minApiLevel: minSdk,
    targetApi: targetSdk,
    targetApiString: `${targetSdk}`,
    gradlePluginVersion: '3.6.0+',
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
    ...overrides,
    // TODO: Implement all helper methods
    escapeXmlAttribute: (value: string) => escape(value),
    escapeXmlString: (value: string) => escape(value),
    escapePropertyValue: (value: string) => value,
    hasDependency: (value: string) => false,
    slashedPackageName: (packageName: string): string =>
      packageName.replace(/\./g, '/'),
    compareVersions: (a: string, b: string): boolean => false,
    activityToLayout: (activityClass: string): string =>
      snakeCase(activityClass),
  })
}
