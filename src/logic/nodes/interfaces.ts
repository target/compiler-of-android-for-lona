import { LogicAST as AST } from '@lona/serialization'
import NamespaceVisitor from '../namespaceVisitor'
import { ScopeVisitor } from '../scopeVisitor'
import { TypeCheckerVisitor } from '../typeChecker'
import { EvaluationVisitor } from '../evaluationVisitor'
import { createNode } from './createNode'
import { compact } from '../../utils/sequence'
import { findNode, findNodes } from '../syntaxNode'
import { FunctionCallExpression } from './FunctionCallExpression'

export type SyntaxNodeType = AST.SyntaxNode['type']

export interface INode {
  syntaxNode: AST.SyntaxNode
  children(): INode[]
  type: SyntaxNodeType
  id: string
}

export class Node<T extends AST.SyntaxNode> implements INode {
  syntaxNode: T

  constructor(syntaxNode: T) {
    this.syntaxNode = syntaxNode
  }

  get type(): SyntaxNodeType {
    return this.syntaxNode.type
  }

  get id(): string {
    return this.syntaxNode.data.id
  }

  children() {
    return compact(AST.subNodes(this.syntaxNode).map(createNode))
  }

  find(
    predicate: (node: AST.SyntaxNode) => boolean
  ): AST.SyntaxNode | undefined {
    return findNode(this.syntaxNode, predicate)
  }

  findAll(predicate: (node: AST.SyntaxNode) => boolean): AST.SyntaxNode[] {
    return findNodes(this.syntaxNode, predicate)
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
