import {
  TraversalConfig,
  emptyConfig,
  reduce,
} from '@lona/compiler/lib/helpers/logic-traversal'
import {
  AST,
  flattenedMemberExpression,
} from '@lona/compiler/lib/helpers/logic-ast'
import { UUID, Namespace } from './namespace'
import { NodePath } from './nodePath'
import { Reporter } from '@lona/compiler/lib/helpers/reporter'
import { silentReporter } from '../reporter'
import ScopeStack from './scopeStack'
import { Traversal, forEach } from './syntaxNode'

export class Scope {
  namespace: Namespace
  currentPath: NodePath = new NodePath()

  constructor(namespace: Namespace) {
    this.namespace = namespace
  }

  // References to the pattern they're defined by (e.g. the record name or function argument)
  identifierExpressionToPattern: { [key: string]: UUID } = {}
  memberExpressionToPattern: { [key: string]: UUID } = {}
  typeIdentifierToPattern: { [key: string]: UUID } = {}

  // Undefined identifiers for better error messages
  undefinedIdentifierExpressions = new Set<UUID>()
  undefinedMemberExpressions = new Set<UUID>()
  undefinedTypeIdentifiers = new Set<UUID>()

  // These keep track of the current scope
  valueNames = new ScopeStack<string, UUID>()
  typeNames = new ScopeStack<string, UUID>()

  get namesInScope(): string[] {
    return Object.keys(this.valueNames.flattened())
  }

  get expressionToPattern(): { [key: string]: UUID } {
    return {
      ...this.identifierExpressionToPattern,
      ...this.memberExpressionToPattern,
    }
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
    this.currentPath.pushComponent(name)
  }

  popNamespace() {
    this.popScope()
    this.currentPath.popComponent()
  }

  addValueToScope(pattern: AST.Pattern) {
    this.valueNames.set(pattern.name, pattern.id)
  }

  addTypeToScope(pattern: AST.Pattern) {
    this.typeNames.set(pattern.name, pattern.id)
  }

  findValueIdentifierReference(name: string): UUID | undefined {
    const valueInScope = this.valueNames.get(name)
    const valueInNamespace = this.namespace.values[name]
    const valueInParentNamespace = this.namespace.values[
      [...this.currentPath.components, name].join('.')
    ]

    return valueInScope || valueInNamespace || valueInParentNamespace
  }

  findTypeIdentifierReference(name: string): UUID | undefined {
    const typeInScope = this.typeNames.get(name)
    const typeInNamespace = this.namespace.types[name]
    const typeInParentNamespace = this.namespace.types[
      [...this.currentPath.components, name].join('.')
    ]

    return typeInScope || typeInNamespace || typeInParentNamespace
  }
}

export class ScopeVisitor {
  namespace: Namespace
  scope: Scope
  reporter: Reporter
  currentPath = new NodePath()

  constructor(namespace: Namespace, scope: Scope, reporter: Reporter) {
    this.namespace = namespace
    this.scope = scope
    this.reporter = reporter
  }

  traverse(rootNode: AST.SyntaxNode, targetId: UUID | undefined = undefined) {
    let walk = (node: AST.SyntaxNode, config: TraversalConfig): Scope => {
      if (node.data.id == targetId) {
        config.stopTraversal = true
        return this.scope
      }

      config.needsRevisitAfterTraversingChildren = true

      if (config._isRevisit) {
        leaveNode(node, this.scope, this.reporter)
      } else {
        enterNode(
          node,
          this.scope,
          config,
          (
            _result: Scope,
            currentNode: AST.SyntaxNode,
            config: TraversalConfig
          ) => walk(currentNode, config),
          this.reporter
        )
      }

      return this.scope
    }

    return forEach(rootNode, Traversal.preorder, walk)
  }
}

type ScopeWalker = (
  result: Scope,
  currentNode: AST.SyntaxNode,
  config: TraversalConfig
) => Scope

function enterNode(
  node: AST.SyntaxNode,
  context: Scope,
  config: TraversalConfig,
  walk: ScopeWalker,
  reporter: Reporter
) {
  switch (node.type) {
    // TODO: The way node types are currently defined in TS, we lose type info for placeholders... probably an issue.
    case 'placeholder':
      return
    case 'typeIdentifier':
      const { genericArguments } = node.data

      genericArguments.forEach(arg => {
        reduce(
          arg,
          (
            result: Scope,
            currentNode: AST.SyntaxNode,
            config: TraversalConfig
          ) => walk(result, currentNode, config),
          context,
          config
        )
      })

      config.ignoreChildren = true
      // config.needsRevisitAfterTraversingChildren = false

      return
    case 'functionType':
      config.ignoreChildren = true
      config.needsRevisitAfterTraversingChildren = false

      return
    case 'memberExpression': {
      config.ignoreChildren = true

      return
    }
    case 'function': {
      const { name, parameters, genericParameters } = node.data

      context.addValueToScope(name)

      context.pushScope()

      parameters.forEach(parameter => {
        switch (parameter.type) {
          case 'parameter':
            context.addValueToScope(parameter.data.localName)
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
      const { name, declarations, genericParameters } = node.data

      context.addTypeToScope(name)

      context.pushNamespace(name.name)

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

            reduce(
              initializer,
              (
                result: Scope,
                currentNode: AST.SyntaxNode,
                config: TraversalConfig
              ) => walk(result, currentNode, config),
              context,
              config
            )

            context.addValueToScope(variableName)
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
      const { name, genericParameters } = node.data

      context.addTypeToScope(name)

      context.pushNamespace(name.name)

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

function leaveNode(node: AST.SyntaxNode, context: Scope, reporter: Reporter) {
  switch (node.type) {
    case 'identifierExpression': {
      const { id, identifier } = node.data

      if (identifier.isPlaceholder) return

      const found = context.findValueIdentifierReference(identifier.string)

      if (found) {
        context.identifierExpressionToPattern[id] = found

        // TEMPORARY
        context.identifierExpressionToPattern[identifier.id] = found
      } else {
        reporter.warn(`No identifier: ${identifier.string}`, context.valueNames)
        context.undefinedIdentifierExpressions.add(id)
      }

      return
    }

    case 'memberExpression': {
      const { id } = node.data

      const identifiers = flattenedMemberExpression(node)

      if (identifiers) {
        const keyPath = identifiers.map(x => x.string).join('.')

        const patternId = context.namespace.values[keyPath]

        if (patternId) {
          context.memberExpressionToPattern[id] = patternId
        } else {
          reporter.warn(`No identifier path: ${keyPath}`)
          context.undefinedMemberExpressions.add(id)
        }
      }

      return
    }

    case 'typeIdentifier': {
      const { id, identifier } = node.data

      if (identifier.isPlaceholder) return

      const found = context.findTypeIdentifierReference(identifier.string)

      if (found) {
        context.typeIdentifierToPattern[id] = found
      } else {
        reporter.warn(
          `No type identifier: ${identifier.string}`,
          context.valueNames
        )
        context.undefinedTypeIdentifiers.add(id)
      }

      return
    }

    case 'variable': {
      const { name } = node.data

      context.addValueToScope(name)

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

// export function createScopeContext(
//   rootNode: AST.SyntaxNode,
//   namespace: Namespace,
//   targetId: UUID | undefined = undefined,
//   reporter: Reporter = silentReporter
// ): Scope {
//   const scope = new Scope(namespace)

//   let visitor = new ScopeVisitor(namespace, scope, reporter)

//   visitor.traverse(rootNode, targetId)

//   return scope
// }

export function createScopeContext(
  node: AST.SyntaxNode,
  namespace: Namespace,
  targetId: UUID | undefined = undefined,
  reporter: Reporter = silentReporter
): Scope {
  const context = new Scope(namespace)

  let traversalConfig = {
    ...emptyConfig(),
    order: 'PreOrder' as TraversalConfig['order'],
  }

  function walk(
    _result: Scope,
    currentNode: AST.SyntaxNode,
    config: TraversalConfig
  ) {
    if (node.data.id == targetId) {
      config.stopTraversal = true
      return context
    }

    config.needsRevisitAfterTraversingChildren = true

    if (config._isRevisit) {
      leaveNode(currentNode, context, reporter)
    } else {
      enterNode(currentNode, context, traversalConfig, walk, reporter)
    }

    return context
  }

  return reduce(node, walk, context, traversalConfig)
}
