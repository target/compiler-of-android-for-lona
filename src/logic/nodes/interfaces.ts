import { LogicAST as AST } from '@lona/serialization'
import NamespaceVisitor from '../namespaceVisitor'
import { ScopeVisitor } from '../scopeVisitor'

export interface INode {
  syntaxNode: AST.SyntaxNode
}

export interface INamespaceContributor extends INode {
  namespaceEnter(visitor: NamespaceVisitor): void
  namespaceLeave(visitor: NamespaceVisitor): void
}

export interface IScopeContributor extends INode {
  scopeEnter(visitor: ScopeVisitor): void
  scopeLeave(visitor: ScopeVisitor): void
}

export interface IDeclaration
  extends INode,
    INamespaceContributor,
    IScopeContributor {}

export interface ITypeAnnotation extends INode, IScopeContributor {}

export interface IExpression extends INode, IScopeContributor {}
