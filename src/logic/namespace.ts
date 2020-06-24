import {
  TraversalConfig,
  emptyConfig,
  reduce,
} from '@lona/compiler/lib/helpers/logic-traversal'
import { EnumerationDeclaration } from '@lona/serialization/build/types/logic-ast/declarations/enumeration'
import { LogicAST as AST } from '@lona/serialization'
import { NodePath } from './nodePath'

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

export function declareValue(namespace: Namespace, path: string, id: UUID) {
  if (namespace.values[path]) {
    throw new Error(`Value already declared: ${path}`)
  }

  namespace.values[path] = id
}

export function declareType(namespace: Namespace, path: string, id: UUID) {
  if (namespace.types[path]) {
    throw new Error(`Type already declared: ${path}`)
  }

  namespace.types[path] = id
}

class NamespaceVisitor {
  namespace: Namespace
  currentPath: NodePath

  constructor(namespace: Namespace) {
    this.currentPath = new NodePath()
    this.namespace = namespace
  }

  pushPathComponent(name: string) {
    this.currentPath.pushComponent(name)
  }

  popPathComponent() {
    this.currentPath.popComponent()
  }

  declareValue(name: string, value: UUID) {
    declareValue(
      this.namespace,
      [...this.currentPath.components, name].join('.'),
      value
    )
  }

  declareType(name: string, type: UUID) {
    declareType(
      this.namespace,
      [...this.currentPath.components, name].join('.'),
      type
    )
  }
}

function enterNode(visitor: NamespaceVisitor, node: AST.SyntaxNode) {
  switch (node.type) {
    case 'record':
    case 'enumeration': {
      const {
        name: { name, id },
      } = node.data

      visitor.declareType(name, id)
      visitor.pushPathComponent(name)

      break
    }
    case 'namespace': {
      const {
        name: { name, id },
      } = node.data

      visitor.pushPathComponent(name)

      break
    }
  }
}

function leaveNode(visitor: NamespaceVisitor, node: AST.SyntaxNode) {
  switch (node.type) {
    case 'variable':
    case 'function': {
      const {
        name: { name, id },
      } = node.data

      visitor.declareValue(name, id)

      break
    }
    case 'record': {
      const {
        name: { name, id },
      } = node.data

      visitor.popPathComponent()

      // Built-ins should be constructed using literals
      if (builtInTypeConstructorNames.has(name)) return

      // Create constructor function
      visitor.declareValue(name, id)

      break
    }
    case 'enumeration': {
      const {
        name: { name, id },
        cases,
      } = (node as EnumerationDeclaration).data

      // Add initializers for each case into the namespace
      cases.forEach(enumCase => {
        switch (enumCase.type) {
          case 'placeholder':
            break
          case 'enumerationCase':
            visitor.declareValue(enumCase.data.name.name, enumCase.data.name.id)
        }
      })

      visitor.popPathComponent()

      break
    }
    case 'namespace': {
      const {
        name: { name, id },
      } = node.data

      visitor.popPathComponent()

      break
    }
  }
}

/**
 * Build the global namespace by visiting each node.
 */
export function createNamespace(topLevelNode?: AST.SyntaxNode): Namespace {
  let namespace: Namespace = { types: {}, values: {} }

  if (!topLevelNode) return namespace

  let traversalConfig = {
    ...emptyConfig(),
    order: 'PreOrder' as TraversalConfig['order'],
  }

  let visitor = new NamespaceVisitor(namespace)

  return reduce(
    topLevelNode,
    (previousValue, currentNode, config) => {
      traversalConfig.needsRevisitAfterTraversingChildren = true

      if (config._isRevisit) {
        leaveNode(visitor, currentNode)
      } else {
        enterNode(visitor, currentNode)
      }

      return namespace
    },
    namespace,
    traversalConfig
  )
}
