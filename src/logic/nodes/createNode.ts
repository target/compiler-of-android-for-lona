import { LogicAST as AST } from '@lona/serialization'
import { createTypeAnnotationNode } from './typeAnnotations'
import {
  INode,
  IScopeContributor,
  ITypeCheckerContributor,
  IExpression,
} from './interfaces'
import { IDeclaration } from './interfaces'
import { VariableDeclaration } from './VariableDeclaration'
import { FunctionDeclaration } from './FunctionDeclaration'
import { RecordDeclaration } from './RecordDeclaration'
import { EnumerationDeclaration } from './EnumerationDeclaration'
import { NamespaceDeclaration } from './NamespaceDeclaration'
import { IdentifierExpression } from './IdentifierExpression'
import { MemberExpression } from './MemberExpression'
import { FunctionCallExpression } from './FunctionCallExpression'

export function createExpressionNode(
  syntaxNode: AST.SyntaxNode
): IExpression | undefined {
  switch (syntaxNode.type) {
    case 'identifierExpression':
      return new IdentifierExpression(syntaxNode)
    case 'memberExpression':
      return new MemberExpression(syntaxNode)
    case 'functionCallExpression':
      return new FunctionCallExpression(syntaxNode)
    default:
      return undefined
  }
}

export function createDeclarationNode(
  syntaxNode: AST.SyntaxNode
): IDeclaration | undefined {
  switch (syntaxNode.type) {
    case 'variable':
      return new VariableDeclaration(syntaxNode)
    case 'record':
      return new RecordDeclaration(syntaxNode)
    case 'enumeration':
      return new EnumerationDeclaration(syntaxNode)
    case 'function':
      return new FunctionDeclaration(syntaxNode)
    case 'namespace':
      return new NamespaceDeclaration(syntaxNode)
    default:
      return undefined
  }
}

function isScopeVisitor(node: INode): node is IScopeContributor {
  return 'scopeEnter' in node || 'scopeLeave' in node
}

function isTypeCheckerVisitor(node: INode): node is ITypeCheckerContributor {
  return 'typeCheckerEnter' in node || 'typeCheckerLeave' in node
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

export function createTypeCheckerVisitor(
  syntaxNode: AST.SyntaxNode
): ITypeCheckerContributor | undefined {
  const node = createNode(syntaxNode)

  return node && isTypeCheckerVisitor(node) ? node : undefined
}
