import { IFS } from 'buffs'
import * as Groovy from '../groovy'

export function addLine(
  buildScript: string,
  blockPath: string | string[],
  line: string
) {
  const program = Groovy.parse(buildScript)

  if (!program) {
    throw new Error('Failed to parse build script')
  }

  const block =
    typeof blockPath === 'string'
      ? Groovy.findBlockByName(program, blockPath)
      : Groovy.findBlockByPath(program, blockPath)

  if (!block) {
    throw new Error(`Failed to find build script block ${blockPath}`)
  }

  const lines: string[] = block.content.flatMap(node =>
    node.type === 'content' ? [node.value] : []
  )

  if (!lines.includes(line)) {
    block.content.push({
      type: 'content',
      value: line,
    })
  }

  return Groovy.print(program)
}

export function addDependencies(
  buildScript: string,
  dependencyLines: string[]
) {
  return dependencyLines.reduce(
    (result, dependency) => addLine(result, ['dependencies'], dependency),
    buildScript
  )
}

export function applyPlugin(buildScript: string, pluginName: string) {
  const program = Groovy.parse(buildScript)

  if (!program) {
    throw new Error('Failed to parse build script')
  }

  program.content.push({
    type: 'content',
    value: `apply plugin: "${pluginName}"`,
  })

  return Groovy.print(program)
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
  buildScriptPath: string
) {
  const originalBuildScript = fs.readFileSync(buildScriptPath, 'utf8')
  const updatedBuildScript = addLine(
    originalBuildScript,
    'dependencies',
    `classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:1.3.50"`
  )

  fs.writeFileSync(buildScriptPath, updatedBuildScript)
}

export function addDependenciesAndPluginsToModuleBuildScript(
  fs: IFS,
  buildScriptPath: string,
  dependencyList: string[]
) {
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

export function enableViewBinding(fs: IFS, buildScriptPath: string) {
  const originalBuildScript = fs.readFileSync(buildScriptPath, 'utf8')
  const updatedBuildScript = addLine(
    originalBuildScript,
    ['android'],
    `viewBinding.enabled = true`
  )
  fs.writeFileSync(buildScriptPath, updatedBuildScript)
}
