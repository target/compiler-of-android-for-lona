import {
  TraversalConfig,
  emptyConfig,
  reduce,
} from '@lona/compiler/lib/helpers/logic-traversal'
import { EnumerationDeclaration } from '@lona/serialization/build/types/logic-ast/declarations/enumeration'
import * as LogicAST from '@lona/compiler/lib/helpers/logic-ast'

type uuid = string

type Namespace = {
  values: { [key: string]: uuid }
  types: { [key: string]: uuid }
}

export const builtInTypeConstructorNames: Set<String> = new Set([
  'Boolean',
  'Number',
  'String',
  'Array',
  'Color',
])

export function copy(namespace: Namespace): Namespace {
  return {
    values: { ...namespace.values },
    types: { ...namespace.types },
  }
}

export function declareValue(namespace: Namespace, path: string, id: uuid) {
  if (namespace.values[path]) {
    throw new Error(`Value already declared: ${path}`)
  }

  namespace.values[path] = id
}

export function declareType(namespace: Namespace, path: string, id: uuid) {
  if (namespace.types[path]) {
    throw new Error(`Type already declared: ${path}`)
  }

  namespace.types[path] = id
}

class NamespaceVisitor {
  namespace: Namespace
  currentPath: string[] = []
  traversalConfig: TraversalConfig

  constructor(namespace: Namespace) {
    this.namespace = namespace
    this.traversalConfig = {
      ...emptyConfig(),
      order: 'PreOrder' as TraversalConfig['order'],
    }
  }

  pushPathComponent(name: string) {
    this.currentPath = [...this.currentPath, name]
  }

  popPathComponent() {
    this.currentPath = this.currentPath.slice(0, -1)
  }

  declareValue(name: string, value: uuid) {
    declareValue(this.namespace, [...this.currentPath, name].join('.'), value)
  }

  declareType(name: string, type: uuid) {
    declareType(this.namespace, [...this.currentPath, name].join('.'), type)
  }
}

export function visit(
  visitor: NamespaceVisitor,
  self: LogicAST.AST.SyntaxNode
) {
  visitor.traversalConfig.needsRevisitAfterTraversingChildren = true

  if (visitor.traversalConfig._isRevisit) {
    switch (self.type) {
      case 'variable': {
        const {
          name: { name, id },
        } = self.data

        visitor.declareValue(name, id)

        break
      }
      case 'function': {
        const {
          name: { name, id },
        } = self.data

        visitor.declareValue(name, id)

        break
      }
      case 'record': {
        const {
          name: { name, id },
        } = self.data

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
        } = (self as EnumerationDeclaration).data

        visitor.declareType(name, id)

        visitor.pushPathComponent(name)

        // Add initializers for each case into the namespace
        cases.forEach(enumCase => {
          switch (enumCase.type) {
            case 'placeholder':
              break
            case 'enumerationCase':
              visitor.declareValue(
                enumCase.data.name.name,
                enumCase.data.name.id
              )
          }
        })

        visitor.popPathComponent()

        break
      }
      case 'namespace': {
        const {
          name: { name, id },
        } = self.data

        visitor.popPathComponent()

        break
      }
    }
  } else {
    switch (self.type) {
      case 'record': {
        const {
          name: { name, id },
        } = self.data

        visitor.declareType(name, id)
        visitor.pushPathComponent(name)

        break
      }
      case 'namespace': {
        const {
          name: { name, id },
        } = self.data

        visitor.pushPathComponent(name)

        break
      }
    }
  }
}

/**
 * Build the global namespace by visiting each node.
 */
export function createNamespace(
  topLevelNode: LogicAST.AST.SyntaxNode
): Namespace {
  let namespace: Namespace = { types: {}, values: {} }
  let visitor = new NamespaceVisitor(namespace)
  return reduce(
    topLevelNode,
    (previousValue, currentNode, config) => {
      visit(visitor, currentNode)
      return namespace
    },
    namespace,
    visitor.traversalConfig
  )
}
