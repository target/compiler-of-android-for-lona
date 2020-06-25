import * as Serialization from '@lona/serialization'
import fs from 'fs'
import isEqual from 'lodash.isequal'
import path from 'path'
import { silentReporter } from '../../reporter'
import { createNamespace } from '../namespace'
import { createScopeContext } from '../scope'
import { StaticType } from '../staticType'
import { makeUnificationContext, substitute, unify } from '../unify'

describe('Logic / Scope', () => {
  it('finds identifier expression references', () => {
    const file = `struct Array<T> {}

let x: Array<Number> = []`

    let rootNode = Serialization.decodeLogic(file)

    let namespace = createNamespace(rootNode)

    let scope = createScopeContext(rootNode, namespace)

    let unification = makeUnificationContext(rootNode, scope, silentReporter)

    const substitution = unify(unification.constraints, silentReporter)

    let type: StaticType = { type: 'variable', value: '?5' }

    let result = substitute(substitution, type)

    while (!isEqual(result, substitute(substitution, result))) {
      result = substitute(substitution, result)
    }

    expect(result).toEqual({ type: 'constant', name: 'Number', parameters: [] })
  })
})
