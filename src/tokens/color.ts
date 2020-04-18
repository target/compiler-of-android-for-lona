import { ColorValue } from '@lona/compiler/lib/plugins/tokens/tokens-ast'
import * as XML from '../xml/ast'
import { createColor } from '../android/resources'

export type Token = {
  qualifiedName: string[]
  value: ColorValue
}

export const convert = (token: Token): XML.Element => {
  return createColor(token.qualifiedName.join('_'), token.value.css)
}
