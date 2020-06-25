import { AST } from '@lona/compiler/lib/helpers/logic-ast'
import * as Serialization from '@lona/serialization'
import fs from 'fs'
import path from 'path'
import util from 'util'

import { createNamespace, UUID } from '../namespace'
import { createScopeContext } from '../scope'
import {
  makeUnificationContext,
  unify,
  substitute,
  Unification,
} from '../unify'
import { silentReporter } from '../../reporter'
import isEqual from 'lodash.isequal'

function readLibrary(name: string): string {
  const librariesPath = path.join(__dirname, '../library')
  return fs.readFileSync(path.join(librariesPath, `${name}.logic`), 'utf8')
}

describe('Logic / Scope', () => {
  it('finds identifier expression references', () => {
    const file = `struct Array<T> {}

let x: Array<Number> = []`

    let rootNode = Serialization.decodeLogic(file)

    let namespace = createNamespace(rootNode)

    let scope = createScopeContext(rootNode, namespace)

    let unification = makeUnificationContext(rootNode, scope, silentReporter)

    const substitution = unify(unification.constraints, silentReporter)

    let type: Unification = { type: 'variable', value: '?5' }

    let result = substitute(substitution, type)

    while (!isEqual(result, substitute(substitution, result))) {
      result = substitute(substitution, result)
    }

    expect(result).toEqual({ type: 'constant', name: 'Number', parameters: [] })
  })
})
