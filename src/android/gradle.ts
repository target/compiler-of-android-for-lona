export type AndroidConfig = {
  compileSdkVersion: number
  buildToolsVersion: string
  defaultConfig: {
    minSdkVersion: number
    targetSdkVersion: number
    versionCode: number
    versionName: string
  }
}

export type BuildScript = {
  plugins: string[]
  android: AndroidConfig
  dependencies: string[]
}

const createApplyPluginStatement = (plugin: string): string =>
  `apply plugin: "${plugin}"`

const createAndroidBlock = (android: AndroidConfig): string[] =>
  `android {
    compileSdkVersion ${android.compileSdkVersion}
    buildToolsVersion "${android.buildToolsVersion}"

    defaultConfig {
        minSdkVersion ${android.defaultConfig.minSdkVersion}
        targetSdkVersion ${android.defaultConfig.targetSdkVersion}
        versionCode ${android.defaultConfig.versionCode}
        versionName "${android.defaultConfig.versionName}"
    }
}`.split('\n')

const createDependencyStatement = (dependency: string): string =>
  `implementation "${dependency}"`

const createBlock = (identifier: string, statements: string[]): string[] =>
  statements.length === 0
    ? []
    : [
        `${identifier} {`,
        ...statements.map(statement => `    ${statement}`),
        `}`,
      ]

const addGroupSeparator = <Element, Group extends Array<Element>>(
  array: Group[],
  separator: Element
): Element[] => {
  return array
    .filter(inner => inner.length > 0)
    .flatMap((inner, index) =>
      index < array.length - 1 ? [...inner, separator] : inner
    )
}

export function createBuildScript(config: BuildScript): string {
  const applyPluginStatements = config.plugins.map(createApplyPluginStatement)
  const androidBlock = createAndroidBlock(config.android)
  const dependencyStatements = createBlock(
    'dependencies',
    config.dependencies.map(createDependencyStatement)
  )

  return addGroupSeparator(
    [applyPluginStatements, androidBlock, dependencyStatements],
    ''
  ).join('\n')
}

export const DEFAULT_PLUGINS = [
  'com.android.library',
  'kotlin-android',
  'kotlin-android-extensions',
]

export const DEFAULT_DEPENDENCIES = [
  'org.jetbrains.kotlin:kotlin-stdlib-jdk7:$kotlin_version',
  'androidx.appcompat:appcompat:1.1.0',
  'androidx.core:core-ktx:1.2.0',
]

export const DEFAULT_ANDROID_CONFIG: AndroidConfig = {
  compileSdkVersion: 29,
  buildToolsVersion: '29.0.2',
  defaultConfig: {
    minSdkVersion: 21,
    targetSdkVersion: 29,
    versionCode: 1,
    versionName: '1.0.0',
  },
}

export const DEFAULT_BUILD_CONFIG: BuildScript = {
  plugins: DEFAULT_PLUGINS,
  android: DEFAULT_ANDROID_CONFIG,
  dependencies: DEFAULT_DEPENDENCIES,
}
