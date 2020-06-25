import { LogicAST as AST } from '@lona/serialization'
import { TraversalConfig } from '@lona/compiler/lib/helpers/logic-traversal'
import { Reporter } from '@lona/compiler/lib/helpers/reporter'
import { NamespaceVisitor } from '../namespace'
import { Scope } from '../scope'

// interface INode {
//   syntaxNode: AST.SyntaxNode
// }

export interface INamespaceContributor {
  namespaceEnter(visitor: NamespaceVisitor): void
  namespaceLeave(visitor: NamespaceVisitor): void
}

export interface IScopeContributor {
  scopeEnter(
    node: AST.SyntaxNode,
    context: Scope,
    config: TraversalConfig,
    walk: (
      result: Scope,
      currentNode: AST.SyntaxNode,
      config: TraversalConfig
    ) => Scope,
    reporter: Reporter
  ): void
  scopeLeave(visitor: NamespaceVisitor): void
}

export interface IDeclaration extends INamespaceContributor {}
