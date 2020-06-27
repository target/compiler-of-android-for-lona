import { LogicAST as AST } from '@lona/serialization'
import { EvaluationVisitor } from '../evaluate'
import { bool, number, string, unit, color, StaticType } from '../staticType'
import { TypeCheckerVisitor } from '../typeChecker'
import { ILiteral } from './interfaces'
import { StandardLibrary } from '../runtime/value'
import { substitute } from '../typeUnifier'

export class NoneLiteral implements ILiteral {
  syntaxNode: AST.NoneLiteral

  constructor(syntaxNode: AST.NoneLiteral) {
    this.syntaxNode = syntaxNode
  }

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {}

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {
    visitor.setType(this.syntaxNode.data.id, unit)
  }

  evaluationEnter(visitor: EvaluationVisitor): void {
    visitor.addValue(this.syntaxNode.data.id, StandardLibrary.unit())
  }
}

export class BooleanLiteral implements ILiteral {
  syntaxNode: AST.BooleanLiteral

  constructor(syntaxNode: AST.BooleanLiteral) {
    this.syntaxNode = syntaxNode
  }

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {}

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {
    visitor.setType(this.syntaxNode.data.id, bool)
  }

  evaluationEnter(visitor: EvaluationVisitor): void {
    const { value, id } = this.syntaxNode.data
    visitor.addValue(id, StandardLibrary.bool(value))
  }
}

export class NumberLiteral implements ILiteral {
  syntaxNode: AST.NumberLiteral

  constructor(syntaxNode: AST.NumberLiteral) {
    this.syntaxNode = syntaxNode
  }

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {}

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {
    visitor.setType(this.syntaxNode.data.id, number)
  }

  evaluationEnter(visitor: EvaluationVisitor): void {
    const { value, id } = this.syntaxNode.data
    visitor.addValue(id, StandardLibrary.number(value))
  }
}

export class StringLiteral implements ILiteral {
  syntaxNode: AST.StringLiteral

  constructor(syntaxNode: AST.StringLiteral) {
    this.syntaxNode = syntaxNode
  }

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {}

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {
    visitor.setType(this.syntaxNode.data.id, string)
  }

  evaluationEnter(visitor: EvaluationVisitor): void {
    const { value, id } = this.syntaxNode.data
    visitor.addValue(id, StandardLibrary.string(value))
  }
}

export class ColorLiteral implements ILiteral {
  syntaxNode: AST.ColorLiteral

  constructor(syntaxNode: AST.ColorLiteral) {
    this.syntaxNode = syntaxNode
  }

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {}

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {
    visitor.setType(this.syntaxNode.data.id, color)
  }

  evaluationEnter(visitor: EvaluationVisitor): void {
    const { value, id } = this.syntaxNode.data
    visitor.addValue(id, StandardLibrary.color(value))
  }
}

export class ArrayLiteral implements ILiteral {
  syntaxNode: AST.ArrayLiteral

  constructor(syntaxNode: AST.ArrayLiteral) {
    this.syntaxNode = syntaxNode
  }

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {}

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {
    const { id, value } = this.syntaxNode.data
    const { typeChecker } = visitor

    const elementType: StaticType = {
      type: 'variable',
      value: typeChecker.typeNameGenerator.next(),
    }

    visitor.setType(id, {
      type: 'constant',
      name: 'Array',
      parameters: [elementType],
    })

    const constraints = value.map(expression => ({
      head: elementType,
      tail: visitor.getType(expression.data.id) || {
        type: 'variable',
        value: typeChecker.typeNameGenerator.next(),
      },
      origin: this.syntaxNode,
    }))

    typeChecker.constraints = typeChecker.constraints.concat(constraints)
  }

  evaluationEnter(visitor: EvaluationVisitor): void {
    const { id, value } = this.syntaxNode.data
    const { typeChecker, reporter, substitution } = visitor

    const type = typeChecker.nodes[id]

    if (!type) {
      reporter.error('Failed to unify type of array')
      return
    }

    const resolvedType = substitute(substitution, type)

    const dependencies = value
      .filter(x => x.type !== 'placeholder')
      .map(x => x.data.id)

    visitor.add(id, {
      label: 'Array Literal',
      dependencies,
      f: values => StandardLibrary.array(resolvedType, values),
    })
  }
}
