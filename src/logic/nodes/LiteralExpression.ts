import { LogicAST as AST } from '@lona/serialization'
import { ScopeVisitor } from '../scopeVisitor'
import { TypeCheckerVisitor } from '../typeChecker'
import { IExpression } from './interfaces'
import { EvaluationVisitor } from '../EvaluationVisitor'

export class LiteralExpression implements IExpression {
  syntaxNode: AST.LiteralExpression

  constructor(syntaxNode: AST.LiteralExpression) {
    this.syntaxNode = syntaxNode
  }

  scopeEnter(visitor: ScopeVisitor): void {}

  scopeLeave(visitor: ScopeVisitor): void {}

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {}

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {
    const { id, literal } = this.syntaxNode.data

    visitor.setType(id, visitor.getType(literal.data.id))
  }

  evaluationEnter(visitor: EvaluationVisitor) {
    const { id, literal } = this.syntaxNode.data

    visitor.add(id, {
      label: 'Literal expression',
      dependencies: [literal.data.id],
      f: values => values[0],
    })
  }
}
