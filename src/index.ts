import { LogicAST } from '@lona/serialization'
import { Plugin } from '@lona/compiler/lib/plugins'
import { Helpers } from '@lona/compiler/lib/helpers'
import * as Tokens from '@lona/compiler/lib/plugins/tokens'
import * as Resources from './android/resources'
import * as Color from './tokens/color'
import * as Shadow from './tokens/shadow'
import * as TextStyle from './tokens/textStyle'
import { Token } from '@lona/compiler/lib/plugins/tokens/tokens-ast'

async function parseFile(
  filePath: string,
  helpers: Helpers,
  options: {
    [argName: string]: unknown
  }
): Promise<void> {
  return Promise.reject('Not implemented')
}

function createColorsResourceFile(tokens: Token[]) {
  const colors: Color.Token[] = tokens.flatMap(({ qualifiedName, value }) =>
    value.type === 'color'
      ? [{ qualifiedName: qualifiedName, value: value.value }]
      : []
  )

  return Resources.createFile(
    colors
      .map(Color.convert)
      .map(element => ({ type: 'element', data: element }))
  )
}

function createShadowsResourceFile(tokens: Token[]) {
  const shadows: Shadow.Token[] = tokens.flatMap(({ qualifiedName, value }) =>
    value.type === 'shadow'
      ? [{ qualifiedName: qualifiedName, value: value.value }]
      : []
  )

  return Resources.createFile(
    shadows
      .map(Shadow.convert)
      .map(element => ({ type: 'element', data: element }))
  )
}

function createTextStyleResourceFile(tokens: Token[]) {
  const textStyles: TextStyle.Token[] = tokens.flatMap(
    ({ qualifiedName, value }) =>
      value.type === 'textStyle'
        ? [{ qualifiedName: qualifiedName, value: value.value }]
        : []
  )

  return Resources.createFile(
    textStyles
      .map(TextStyle.convert)
      .map(element => ({ type: 'element', data: element }))
  )
}

async function parseWorkspace(
  workspacePath: string,
  helpers: Helpers,
  options: {
    [argName: string]: unknown
  }
): Promise<void> {
  let convertedWorkspace: Tokens.ConvertedWorkspace

  try {
    const converted = await Tokens.parseWorkspace(workspacePath, helpers, {
      output: false,
    })

    if (!converted) {
      Promise.reject('Problem')
      return
    }

    convertedWorkspace = converted
  } catch (error) {
    console.log('Failed to convert tokens')
    return Promise.reject(error)
  }

  const tokens = convertedWorkspace.files.flatMap(file =>
    file.contents.type === 'flatTokens' ? file.contents.value : []
  )

  const colorsFile = createColorsResourceFile(tokens)
  const shadowsFile = createShadowsResourceFile(tokens)
  const textStylesFile = createTextStyleResourceFile(tokens)

  await helpers.fs.writeFile('colors.xml', colorsFile)
  await helpers.fs.writeFile('elevations.xml', shadowsFile)
  await helpers.fs.writeFile('text-styles.xml', textStylesFile)
}

const plugin: Plugin = {
  format: 'android',
  parseFile,
  parseWorkspace,
}

export default plugin
