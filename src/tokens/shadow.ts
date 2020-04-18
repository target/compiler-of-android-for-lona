import { ShadowValue } from '@lona/compiler/lib/plugins/tokens/tokens-ast'
import * as XML from '../xml/ast'
import { createDimen } from '../android/resources'

export type Token = {
  qualifiedName: string[]
  value: ShadowValue
}

export const convert = (token: Token): XML.Element => {
  return createDimen(token.qualifiedName.join('_'), '2dp')
}
