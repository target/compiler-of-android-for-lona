import path from 'path'
import { IFS, copy, describe } from 'buffs'
import { Context } from '../freemarker'

const DEPENDENCIES_RE = /([ \t]*)dependencies \{(.*?)\}/gs

export function addDependency(buildScript: string, dependencyLine: string) {
  const matches = Array.from(buildScript.matchAll(DEPENDENCIES_RE))
  const match: RegExpMatchArray | undefined = matches[matches.length - 1]

  if (match && typeof match.index === 'number') {
    const [block, whitespace, contents] = match

    const dependencies = contents
      .split('\n')
      .map(d => d.trim())
      .filter(d => !!d)

    if (!dependencies.includes(dependencyLine)) {
      dependencies.push(dependencyLine)
    }

    const updated = `${whitespace}dependencies {
${dependencies.map(d => whitespace + ' '.repeat(4) + d).join('\n')}
${whitespace}}`

    return (
      buildScript.slice(0, match.index) +
      updated +
      buildScript.slice(match.index + block.length)
    )
  } else {
    console.error('Failed to parse build script dependencies')
    return buildScript
  }
}

export function addDependencies(
  buildScript: string,
  dependencyLines: string[]
) {
  return dependencyLines.reduce(
    (result, dependency) => addDependency(result, dependency),
    buildScript
  )
}

export function applyPlugin(buildScript: string, pluginName: string) {
  return [buildScript, `apply plugin: "${pluginName}"`].join('\n\n')
}

export function applyPlugins(buildScript: string, pluginNames: string[]) {
  return pluginNames.reduce(
    (result, dependency) => applyPlugin(result, dependency),
    buildScript
  )
}

/**
 * Add a hardcoded kotlin gradle plugin dependency to the root build script
 */
export function addKotlinDependencyToRootBuildScript(
  fs: IFS,
  context: Context,
  outputPath: string
) {
  const buildScriptPath = path.join(
    outputPath,
    context.get('topOut'),
    'build.gradle'
  )
  const originalBuildScript = fs.readFileSync(buildScriptPath, 'utf8')
  const updatedBuildScript = addDependency(
    originalBuildScript,
    `classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:1.3.50"`
  )

  fs.writeFileSync(buildScriptPath, updatedBuildScript)
}

export function addDependenciesAndPluginsToModuleBuildScript(
  fs: IFS,
  context: Context,
  outputPath: string
) {
  const dependencyList: string[] = context.get('dependencyList') || []
  const buildScriptPath = path.join(
    outputPath,
    context.get('projectOut'),
    'build.gradle'
  )
  const originalBuildScript = fs.readFileSync(buildScriptPath, 'utf8')
  const targetBuildScript = applyPlugins(
    addDependencies(
      originalBuildScript,
      dependencyList.map(d => `implementation "${d}"`)
    ),
    ['kotlin-android', 'kotlin-android-extensions']
  )

  fs.writeFileSync(buildScriptPath, targetBuildScript)
}
