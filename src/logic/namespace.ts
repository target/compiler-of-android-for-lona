import {
  TraversalConfig,
  emptyConfig,
  reduce,
} from '@lona/compiler/lib/helpers/logic-traversal'
import { LogicAST as AST } from '@lona/serialization'
import { NodePath } from './nodePath'
import { createDeclarationNode } from './nodes/declarations'
import { forEach, Traversal, visit } from './syntaxNode'

export type UUID = string

export type Namespace = {
  values: { [key: string]: UUID }
  types: { [key: string]: UUID }
}

export const builtInTypeConstructorNames: Set<String> = new Set([
  'Boolean',
  'Number',
  'String',
  'Array',
  'Color',
])

/**
 * Merge namespaces, throwing an error in the case of collisions
 */
export function merge(namespaces: Namespace[]): Namespace {
  return namespaces.reduce((result, namespace) => {
    Object.entries(namespace.values).forEach(([key, value]) => {
      if (key in result.values) {
        throw new Error(`Namespace error: value ${key} declared more than once`)
      }

      result.values[key] = value
    })

    Object.entries(namespace.types).forEach(([key, type]) => {
      if (key in result.types) {
        throw new Error(`Namespace error: type ${key} declared more than once`)
      }

      result.types[key] = type
    })

    return result
  }, createNamespace())
}

export function copy(namespace: Namespace): Namespace {
  return {
    values: { ...namespace.values },
    types: { ...namespace.types },
  }
}

export class NamespaceVisitor {
  namespace: Namespace
  currentPath = new NodePath()

  constructor(namespace: Namespace) {
    this.namespace = namespace
  }

  pushPathComponent(name: string) {
    this.currentPath.pushComponent(name)
  }

  popPathComponent() {
    this.currentPath.popComponent()
  }

  declareValue(name: string, value: UUID) {
    const path = this.currentPath.pathString(name)

    if (this.namespace.values[path]) {
      throw new Error(`Value already declared: ${path}`)
    }

    this.namespace.values[path] = value
  }

  declareType(name: string, type: UUID) {
    const path = this.currentPath.pathString(name)

    if (this.namespace.types[path]) {
      throw new Error(`Type already declared: ${path}`)
    }

    this.namespace.types[path] = type
  }

  traverse(rootNode: AST.SyntaxNode) {
    visit(rootNode, Traversal.preorder, {
      enter: node => createDeclarationNode(node)?.namespaceEnter(this),
      leave: node => createDeclarationNode(node)?.namespaceLeave(this),
    })
  }
}

/**
 * Build the global namespace by visiting each node.
 */
export function createNamespace(topLevelNode?: AST.SyntaxNode): Namespace {
  let namespace: Namespace = { types: {}, values: {} }

  if (topLevelNode) {
    let visitor = new NamespaceVisitor(namespace)

    visitor.traverse(topLevelNode)
  }

  return namespace
}
