import { LogicAST as AST } from '@lona/serialization'
import { createDeclarationNode } from './declarations'
import { createTypeAnnotationNode } from './typeAnnotations'
import { createExpressionNode } from './expressions'
import { INode, IScopeContributor } from './interfaces'

function isScopeVisitor(node: INode): node is IScopeContributor {
  return 'scopeEnter' in node || 'scopeLeave' in node
}

export function createNode(syntaxNode: AST.SyntaxNode) {
  return (
    createDeclarationNode(syntaxNode) ||
    createTypeAnnotationNode(syntaxNode) ||
    createExpressionNode(syntaxNode)
  )
}

export function createScopeVisitor(
  syntaxNode: AST.SyntaxNode
): IScopeContributor | undefined {
  const node = createNode(syntaxNode)

  return node && isScopeVisitor(node) ? node : undefined
}
