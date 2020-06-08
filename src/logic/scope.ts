import {
  TraversalConfig,
  emptyConfig,
  reduce,
} from '@lona/compiler/lib/helpers/logic-traversal'
import {
  AST,
  flattenedMemberExpression,
} from '@lona/compiler/lib/helpers/logic-ast'
import { UUID, Namespace, createNamespace } from './namespace'

class ScopeStack<K extends string, V> {
  public scopes: { [key: string]: V }[] = [{}]

  public get(k: K): V | void {
    return this.scopes.map(x => x[k]).filter(x => !!x)[0]
  }

  public set(k: K, v: V) {
    this.scopes[0][k] = v
  }

  public push() {
    this.scopes = [{}, ...this.scopes]
  }

  public pop(): { [key: string]: V } {
    const [hd, ...rest] = this.scopes
    this.scopes = rest
    return hd
  }

  public flattened(): { [key: string]: V } {
    let result: { [key: string]: V } = {}

    this.scopes.reverse().forEach(x =>
      Object.keys(x).forEach(k => {
        result[k] = x[k]
      })
    )

    return result
  }

  public copy() {
    const stack = new ScopeStack<K, V>()
    stack.scopes = this.scopes.map(x => ({ ...x }))
    return stack
  }
}

export class ScopeContext {
  namespace: Namespace

  constructor(namespace: Namespace) {
    this.namespace = namespace
  }

  currentNamespacePath: string[] = []

  // Values in these are never removed, even if a variable is out of scope
  patternToName: { [key: string]: string } = {}
  patternToTypeName: { [key: string]: string } = {}
  identifierToPattern: { [key: string]: UUID } = {}
  undefinedIdentifiers = new Set<UUID>()
  undefinedMemberExpressions = new Set<UUID>()

  // This keeps track of the current scope
  valueNames = new ScopeStack<string, UUID>()
  typeNames = new ScopeStack<string, UUID>()

  get namesInScope(): string[] {
    return Object.keys(this.valueNames.flattened())
  }

  pushScope() {
    this.valueNames.push()
    this.typeNames.push()
  }

  popScope() {
    this.valueNames.pop()
    this.typeNames.pop()
  }

  pushNamespace(name: string) {
    this.pushScope()
    this.currentNamespacePath.push(name)
  }

  popNamespace() {
    this.popScope()
    this.currentNamespacePath.pop()
  }

  addToScope(pattern: AST.Pattern) {
    this.patternToName[pattern.id] = pattern.name
    this.valueNames.set(pattern.id, pattern.name)
  }

  addTypeToScope(pattern: AST.Pattern) {
    this.patternToTypeName[pattern.id] = pattern.name
    this.typeNames.set(pattern.id, pattern.name)
  }
}

function enterNode(
  node: AST.SyntaxNode,
  context: ScopeContext,
  config: TraversalConfig,
  walk: (
    result: ScopeContext,
    currentNode: AST.SyntaxNode,
    config: TraversalConfig
  ) => ScopeContext
) {
  switch (node.type) {
    // TODO: The way node types are currently defined in TS, we lose type info for placeholders... probably an issue.
    case 'placeholder':
      return
    case 'typeIdentifier':
      const { genericArguments } = node.data

      genericArguments.forEach(arg => {
        reduce(arg, walk, context, config)
      })

      config.ignoreChildren = true
      config.needsRevisitAfterTraversingChildren = false

      return
    case 'functionType':
      config.ignoreChildren = true
      config.needsRevisitAfterTraversingChildren = false

      return
    case 'memberExpression': {
      config.ignoreChildren = true

      const identifiers = flattenedMemberExpression(node)

      if (identifiers) {
        const keyPath = identifiers.map(x => x.string).join('.')

        const patternId = context.namespace.values[keyPath]

        if (patternId) {
          context.identifierToPattern[node.data.id] = patternId
        } else {
          console.warn(`No identifier path: ${keyPath}`)
          context.undefinedMemberExpressions.add(node.data.id)
        }
      }

      return
    }
    case 'function': {
      const { name, parameters, genericParameters } = node.data

      context.addToScope(name)

      context.pushScope()

      parameters.forEach(parameter => {
        switch (parameter.type) {
          case 'parameter':
            context.addToScope(parameter.data.localName)
          case 'placeholder':
            break
        }
      })

      genericParameters.forEach(parameter => {
        switch (parameter.type) {
          case 'parameter':
            context.addTypeToScope(parameter.data.name)
          case 'placeholder':
            break
        }
      })

      return
    }
    case 'record': {
      const {
        name: { name },
        declarations,
        genericParameters,
      } = node.data

      context.pushNamespace(name)

      genericParameters.forEach(parameter => {
        switch (parameter.type) {
          case 'parameter':
            context.addTypeToScope(parameter.data.name)
          case 'placeholder':
            break
        }
      })

      // Handle variable initializers manually
      declarations.forEach(declaration => {
        switch (declaration.type) {
          case 'variable': {
            const { name: variableName, initializer } = declaration.data

            if (!initializer) break

            reduce(initializer, walk, context, config)

            context.addToScope(variableName)
          }
          default:
            break
        }
      })

      // Don't introduce variables names into scope
      config.ignoreChildren = true

      return
    }
    case 'enumeration': {
      const {
        name: { name },
        genericParameters,
      } = node.data

      context.pushNamespace(name)

      genericParameters.forEach(parameter => {
        switch (parameter.type) {
          case 'parameter':
            context.addTypeToScope(parameter.data.name)
          case 'placeholder':
            break
        }
      })

      return
    }
    case 'namespace': {
      const {
        name: { name },
      } = node.data

      context.pushNamespace(name)
      return
    }
  }
}

function leaveNode(node: AST.SyntaxNode, context: ScopeContext) {
  function findValueIdentifierReference(
    identifier: AST.Identifier
  ): UUID | undefined {
    if (identifier.isPlaceholder) return

    const valueInScope = context.valueNames.get(identifier.string)
    const valueInNamespace = context.namespace.values[identifier.string]
    const valueInParentNamespace =
      context.namespace.values[
        [...context.currentNamespacePath, identifier.string].join('.')
      ]

    return valueInScope || valueInNamespace || valueInParentNamespace
  }

  function findTypeIdentifierReference(
    identifier: AST.Identifier
  ): UUID | undefined {
    if (identifier.isPlaceholder) return

    const typeInScope = context.typeNames.get(identifier.string)
    const typeInNamespace = context.namespace.types[identifier.string]
    const typeInParentNamespace =
      context.namespace.types[
        [...context.currentNamespacePath, identifier.string].join('.')
      ]

    return typeInScope || typeInNamespace || typeInParentNamespace
  }

  switch (node.type) {
    case 'identifierExpression': {
      const { identifier } = node.data

      const found = findValueIdentifierReference(identifier)

      if (found) {
        context.identifierToPattern[identifier.id] = found
      } else {
        console.warn(`No identifier: ${identifier.string}`, context.valueNames)
        context.undefinedIdentifiers.add(identifier.id)
      }

      return
    }

    case 'memberExpression': {
      const { memberName: identifier } = node.data

      const found = findValueIdentifierReference(identifier)

      if (found) {
        context.identifierToPattern[identifier.id] = found
      } else {
        console.warn(
          `No member identifier: ${identifier.string}`,
          context.valueNames
        )
        context.undefinedIdentifiers.add(identifier.id)
      }

      return
    }

    case 'typeIdentifier': {
      const { identifier } = node.data

      const found = findTypeIdentifierReference(identifier)

      if (found) {
        context.identifierToPattern[identifier.id] = found
      } else {
        console.warn(
          `No type identifier: ${identifier.string}`,
          context.valueNames
        )
        context.undefinedIdentifiers.add(identifier.id)
      }

      return
    }

    case 'variable': {
      const { name } = node.data

      context.addToScope(name)

      return
    }

    case 'function':
      context.popScope()
      return

    case 'record':
      context.popNamespace()
      return

    case 'enumeration':
      context.popNamespace()
      return

    case 'namespace':
      context.popNamespace()
      return
  }
}

export function createScopeContext(
  node: AST.SyntaxNode,
  namespace: Namespace,
  targetId: UUID | undefined = undefined
): ScopeContext {
  const context = new ScopeContext(namespace)

  let traversalConfig = {
    ...emptyConfig(),
    order: 'PreOrder' as TraversalConfig['order'],
  }

  function walk(
    result: ScopeContext,
    currentNode: AST.SyntaxNode,
    config: TraversalConfig
  ) {
    if (node.data.id == targetId) {
      config.stopTraversal = true
      return result
    }

    config.needsRevisitAfterTraversingChildren = true

    if (config._isRevisit) {
      leaveNode(currentNode, context)
    } else {
      enterNode(currentNode, context, traversalConfig, walk)
    }

    return context
  }

  return reduce(node, walk, context, traversalConfig)
}
