import { LogicAST as AST } from '@lona/serialization'
import NamespaceVisitor from '../namespaceVisitor'
import { ScopeVisitor } from '../scopeVisitor'
import { TypeCheckerVisitor } from '../typeChecker'
import { EvaluationVisitor } from '../EvaluationVisitor'

export interface INode {
  syntaxNode: AST.SyntaxNode
}

export class Node<T extends AST.SyntaxNode> implements INode {
  syntaxNode: T

  constructor(syntaxNode: T) {
    this.syntaxNode = syntaxNode
  }

  children(): AST.SyntaxNode[] {
    return AST.subNodes(this.syntaxNode)
  }
}

export interface INamespaceContributor extends INode {
  namespaceEnter(visitor: NamespaceVisitor): void
  namespaceLeave(visitor: NamespaceVisitor): void
}

export interface IScopeContributor extends INode {
  scopeEnter(visitor: ScopeVisitor): void
  scopeLeave(visitor: ScopeVisitor): void
}

export interface ITypeCheckerContributor extends INode {
  typeCheckerEnter(visitor: TypeCheckerVisitor): void
  typeCheckerLeave(visitor: TypeCheckerVisitor): void
}

export interface IEvaluationContributor extends INode {
  evaluationEnter(visitor: EvaluationVisitor): void
}

export interface IDeclaration
  extends INode,
    INamespaceContributor,
    IScopeContributor {}

export interface ITypeAnnotation extends INode, IScopeContributor {}

export interface IExpression extends INode, IScopeContributor {}

export interface ILiteral
  extends INode,
    ITypeCheckerContributor,
    IEvaluationContributor {}
