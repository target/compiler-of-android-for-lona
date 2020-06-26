import { flattenedMemberExpression } from '@lona/compiler/lib/helpers/logic-ast'
import { LogicAST as AST } from '@lona/serialization'
import { ScopeVisitor } from '../scopeVisitor'
import { IExpression } from './interfaces'
import { TypeCheckerVisitor } from '../typeChecker'

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

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {
    const { traversalConfig } = visitor

    traversalConfig.ignoreChildren = true
  }

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {
    const { id } = this.syntaxNode.data
    const { scope, typeChecker } = visitor

    typeChecker.nodes[id] = visitor.specificIdentifierType(
      scope,
      typeChecker,
      id
    )
  }
}
