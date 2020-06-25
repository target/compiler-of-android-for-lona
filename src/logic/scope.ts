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
import { Traversal, visit } from './syntaxNode'
import { createNode, createScopeVisitor } from './nodes/createNode'

export class Scope {
  currentPath: NodePath = new NodePath()

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
}

export class ScopeVisitor {
  namespace: Namespace
  scope: Scope
  reporter: Reporter
  currentPath = new NodePath()
  traversalConfig = Traversal.preorder
  targetId?: UUID

  constructor(
    namespace: Namespace,
    scope: Scope,
    reporter: Reporter,
    targetId?: string
  ) {
    this.namespace = namespace
    this.scope = scope
    this.reporter = reporter
    this.targetId = targetId
  }

  traverse(rootNode: AST.SyntaxNode) {
    visit(rootNode, this.traversalConfig, {
      targetId: this.targetId,
      enter: (node: AST.SyntaxNode) =>
        createScopeVisitor(node)?.scopeEnter(this),
      leave: (node: AST.SyntaxNode) =>
        createScopeVisitor(node)?.scopeLeave(this),
    })
  }

  // Scope helpers

  pushScope() {
    this.scope.valueNames.push()
    this.scope.typeNames.push()
  }

  popScope() {
    this.scope.valueNames.pop()
    this.scope.typeNames.pop()
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
    this.scope.valueNames.set(pattern.name, pattern.id)
  }

  addTypeToScope(pattern: AST.Pattern) {
    this.scope.typeNames.set(pattern.name, pattern.id)
  }

  findValueIdentifierReference(name: string): UUID | undefined {
    const valueInScope = this.scope.valueNames.get(name)
    const valueInNamespace = this.namespace.values[name]
    const valueInParentNamespace = this.namespace.values[
      [...this.currentPath.components, name].join('.')
    ]

    return valueInScope || valueInNamespace || valueInParentNamespace
  }

  findTypeIdentifierReference(name: string): UUID | undefined {
    const typeInScope = this.scope.typeNames.get(name)
    const typeInNamespace = this.namespace.types[name]
    const typeInParentNamespace = this.namespace.types[
      [...this.currentPath.components, name].join('.')
    ]

    return typeInScope || typeInNamespace || typeInParentNamespace
  }
}

export function createScopeContext(
  rootNode: AST.SyntaxNode,
  namespace: Namespace,
  targetId: UUID | undefined = undefined,
  reporter: Reporter = silentReporter
): Scope {
  const scope = new Scope()

  let visitor = new ScopeVisitor(namespace, scope, reporter, targetId)

  visitor.traverse(rootNode)

  return scope
}
