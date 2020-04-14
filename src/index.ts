import * as path from 'path'
import { LogicAST } from '@lona/serialization'
import { Plugin } from '@lona/compiler/lib/plugins'
import { Helpers } from '@lona/compiler/lib/helpers'
import upperFirst from 'lodash.upperfirst'
import camelCase from 'lodash.camelcase'

function convertNode(
  logicNode: LogicAST.SyntaxNode,
  filePath: string,
  helpers: Helpers
): string | null {
  if (
    logicNode.type !== 'topLevelDeclarations' ||
    logicNode.data.declarations.length === 0
  ) {
    return null
  }

  return ''
}

async function parseFile(
  filePath: string,
  helpers: Helpers,
  options: {
    [argName: string]: unknown
  }
): Promise<string> {
  const logicNode = helpers.config.logicFiles[filePath]

  if (!logicNode) return ''

  const kotlinAst = convertNode(logicNode, filePath, helpers)

  if (!kotlinAst) return ''

  // // only output file if we passed an output option
  // const outputFile =
  //   typeof options['output'] !== 'undefined' ? helpers.fs.writeFile : undefined

  // return `${renderJS(jsAST, { outputFile, reporter: helpers.reporter })}`

  return ''
}

async function parseWorkspace(
  workspacePath: string,
  helpers: Helpers,
  options: {
    [argName: string]: unknown
  }
): Promise<void> {
  const paths = [...helpers.config.logicPaths, ...helpers.config.documentPaths]
  const imports = []

  await Promise.all(
    paths.map(async filePath => {
      const convertedContent = await parseFile(filePath, helpers, options)

      if (!convertedContent) return

      const name = upperFirst(
        camelCase(path.basename(filePath, path.extname(filePath)))
      )

      const outputPath = path.join(path.dirname(filePath), `${name}.js`)

      imports.push(outputPath)

      await helpers.fs.writeFile(outputPath, convertedContent)
    })
  )

  return
}

const plugin: Plugin = {
  format: 'android',
  parseFile,
  parseWorkspace,
}

export default plugin
