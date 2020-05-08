import { ColorValue } from '@lona/compiler/lib/plugins/tokens/tokens-ast'
import * as XML from '../xml/ast'
import {
  createColor,
  cssToHexColor,
  formatQualifiedName,
  Options,
} from '../android/valueResources'

export type Token = {
  qualifiedName: string[]
  value: ColorValue
}

export const convert = (token: Token, options: Options): XML.Element => {
  return createColor(
    formatQualifiedName(token.qualifiedName, options),
    cssToHexColor(token.value.css)
  )
}
