import { Token } from '@lona/compiler/lib/plugins/tokens/tokens-ast'

import * as XML from '../xml/ast'
import * as Color from './color'
import * as Shadow from './shadow'
import * as TextStyle from './textStyle'

function getColorTokens(tokens: Token[]): Color.Token[] {
  return tokens.flatMap(({ qualifiedName, value }) =>
    value.type === 'color'
      ? [{ qualifiedName: qualifiedName, value: value.value }]
      : []
  )
}

function getShadowsTokens(tokens: Token[]): Shadow.Token[] {
  return tokens.flatMap(({ qualifiedName, value }) =>
    value.type === 'shadow'
      ? [{ qualifiedName: qualifiedName, value: value.value }]
      : []
  )
}

function getTextStyleTokens(tokens: Token[]): TextStyle.Token[] {
  return tokens.flatMap(({ qualifiedName, value }) =>
    value.type === 'textStyle'
      ? [{ qualifiedName: qualifiedName, value: value.value }]
      : []
  )
}

export type TokenResources = {
  colors: XML.Element[]
  elevations: XML.Element[]
  textStyles: XML.Element[]
}

export function createValueResources(
  tokens: Token[],
  options: { minSdk: number }
): TokenResources {
  return {
    elevations: getShadowsTokens(tokens).map(Shadow.convert),
    colors: getColorTokens(tokens).map(Color.convert),
    textStyles: getTextStyleTokens(tokens).map(textStyle =>
      TextStyle.convert(textStyle, options)
    ),
  }
}
