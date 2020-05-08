import { ShadowValue } from '@lona/compiler/lib/plugins/tokens/tokens-ast'
import * as XML from '../xml/ast'
import {
  createDimen,
  formatQualifiedName,
  Options,
} from '../android/valueResources'

export type Token = {
  qualifiedName: string[]
  value: ShadowValue
}

export const convert = (token: Token, options: Options): XML.Element => {
  return createDimen(formatQualifiedName(token.qualifiedName, options), '2dp')
}
