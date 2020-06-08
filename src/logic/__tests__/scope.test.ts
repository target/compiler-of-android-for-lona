import {
  TraversalConfig,
  emptyConfig,
  reduce,
} from '@lona/compiler/lib/helpers/logic-traversal'
import { AST } from '@lona/compiler/lib/helpers/logic-ast'
import * as Serialization from '@lona/serialization'
import fs from 'fs'
import path from 'path'

import { createNamespace, UUID } from '../namespace'
import { createScopeContext } from '../scope'
import { findNode } from '../node'

function readLibrary(name: string): string {
  const librariesPath = path.join(__dirname, '../library')
  return fs.readFileSync(path.join(librariesPath, `${name}.logic`), 'utf8')
}

describe('Logic / Scope', () => {
  it('finds identifier expression references', () => {
    const file = `struct Number {}

let x: Number = 42

let y: Number = x`

    let rootNode = Serialization.decodeLogic(file)

    let namespace = createNamespace(rootNode)

    const variable = findNode(rootNode, node => {
      return node.type === 'variable' && node.data.name.name === 'x'
    }) as AST.VariableDeclaration

    const identifierExpression = findNode(rootNode, node => {
      return (
        node.type === 'identifierExpression' &&
        node.data.identifier.string === 'x'
      )
    }) as AST.IdentifierExpression

    expect(variable).not.toBeUndefined()

    expect(identifierExpression).not.toBeUndefined()

    let scope = createScopeContext(
      rootNode,
      namespace,
      identifierExpression.data.id
    )

    expect(
      scope.identifierToPattern[identifierExpression.data.identifier.id]
    ).toEqual(variable.data.name.id)

    expect(Object.values(scope.valueNames.flattened())).toEqual(['x', 'y'])
  })

  it('finds member expression references', () => {
    const file = `struct Number {}

extension Foo {
  let x: Number = 42
}

let y: Number = Foo.x`

    let rootNode = Serialization.decodeLogic(file)

    let namespace = createNamespace(rootNode)

    const variable = findNode(rootNode, node => {
      return node.type === 'variable' && node.data.name.name === 'x'
    }) as AST.VariableDeclaration

    const memberExpression = findNode(rootNode, node => {
      return (
        node.type === 'memberExpression' && node.data.memberName.string === 'x'
      )
    }) as AST.MemberExpression

    expect(variable).not.toBeUndefined()

    expect(memberExpression).not.toBeUndefined()

    let scope = createScopeContext(
      rootNode,
      namespace,
      memberExpression.data.id
    )

    expect(scope.identifierToPattern[memberExpression.data.id]).toEqual(
      variable.data.name.id
    )

    expect(Object.values(scope.valueNames.flattened())).toEqual(['y'])
  })

  it('finds type identifier references', () => {
    const file = `enum Foo {
    case bar()
  }

  let y: Foo = Foo.bar()`

    let rootNode = Serialization.decodeLogic(file)

    let namespace = createNamespace(rootNode)

    const enumeration = findNode(rootNode, node => {
      return node.type === 'enumeration' && node.data.name.name === 'Foo'
    }) as AST.EnumerationDeclaration

    const enumerationCase = findNode(rootNode, node => {
      return node.type === 'enumerationCase' && node.data.name.name === 'bar'
    }) as AST.EnumerationCase

    const memberExpression = findNode(rootNode, node => {
      return (
        node.type === 'memberExpression' &&
        node.data.memberName.string === 'bar'
      )
    }) as AST.MemberExpression

    const typeIdentifier = findNode(rootNode, node => {
      return (
        node.type === 'typeIdentifier' && node.data.identifier.string === 'Foo'
      )
    }) as AST.TypeIdentifierTypeAnnotation

    expect(enumeration).not.toBeUndefined()

    expect(enumerationCase).not.toBeUndefined()

    expect(memberExpression).not.toBeUndefined()

    expect(typeIdentifier).not.toBeUndefined()

    let scope = createScopeContext(
      rootNode,
      namespace,
      memberExpression.data.id
    )

    expect(
      scope.identifierToPattern[typeIdentifier.data.identifier.id]
    ).toEqual(enumeration.data.name.id)

    // TODO: Fix EnumerationCase being a union with placeholder
    if (enumerationCase.type !== 'enumerationCase') {
      throw new Error('Bad enumeration case')
    }

    expect(scope.identifierToPattern[memberExpression.data.id]).toEqual(
      enumerationCase.data.name.id
    )

    expect(Object.values(scope.valueNames.flattened())).toEqual(['y'])
    expect(Object.values(scope.typeNames.flattened())).toEqual(['Foo'])
  })
})
