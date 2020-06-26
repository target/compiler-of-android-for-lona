import { flattenedMemberExpression } from '@lona/compiler/lib/helpers/logic-ast'
import { LogicAST as AST } from '@lona/serialization'
import { ScopeVisitor } from '../scopeVisitor'
import { IExpression } from './interfaces'

export function createExpressionNode(
  syntaxNode: AST.SyntaxNode
): IExpression | undefined {
  switch (syntaxNode.type) {
    case 'identifierExpression':
      return new IdentifierExpression(syntaxNode)
    case 'memberExpression':
      return new MemberExpression(syntaxNode)
    default:
      return undefined
  }
}

export class IdentifierExpression implements IExpression {
  syntaxNode: AST.IdentifierExpression

  constructor(syntaxNode: AST.IdentifierExpression) {
    this.syntaxNode = syntaxNode
  }

  scopeEnter(visitor: ScopeVisitor): void {}

  scopeLeave(visitor: ScopeVisitor): void {
    const { id, identifier } = this.syntaxNode.data

    if (identifier.isPlaceholder) return

    const found = visitor.findValueIdentifierReference(identifier.string)

    if (found) {
      visitor.scope.identifierExpressionToPattern[id] = found

      // TEMPORARY. We shouldn't add an identifier to this, only identifierExpression
      visitor.scope.identifierExpressionToPattern[identifier.id] = found
    } else {
      visitor.reporter.warn(
        `No identifier: ${identifier.string}`,
        visitor.scope.valueNames
      )
      visitor.scope.undefinedIdentifierExpressions.add(id)
    }
  }
}

export class MemberExpression implements IExpression {
  syntaxNode: AST.MemberExpression

  constructor(syntaxNode: AST.MemberExpression) {
    this.syntaxNode = syntaxNode
  }

  scopeEnter(visitor: ScopeVisitor): void {
    visitor.traversalConfig.ignoreChildren = true
  }

  scopeLeave(visitor: ScopeVisitor): void {
    const { id } = this.syntaxNode.data

    const identifiers = flattenedMemberExpression(this.syntaxNode)

    if (identifiers) {
      const keyPath = identifiers.map(x => x.string).join('.')

      const patternId = visitor.namespace.values[keyPath]

      if (patternId) {
        visitor.scope.memberExpressionToPattern[id] = patternId
      } else {
        visitor.reporter.warn(`No identifier path: ${keyPath}`)
        visitor.scope.undefinedMemberExpressions.add(id)
      }
    }
  }
}
