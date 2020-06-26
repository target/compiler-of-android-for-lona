import { nonNullable } from '@lona/compiler/lib/utils/non-nullable'
import { LogicAST as AST } from '@lona/serialization'
import { ScopeVisitor } from '../scopeVisitor'
import { IExpression } from './interfaces'
import { TypeCheckerVisitor } from '../typeChecker'
import { StaticType, FunctionArgument } from '../staticType'

export class FunctionCallExpression implements IExpression {
  syntaxNode: AST.FunctionCallExpression

  constructor(syntaxNode: AST.FunctionCallExpression) {
    this.syntaxNode = syntaxNode
  }

  scopeEnter(visitor: ScopeVisitor): void {}

  scopeLeave(visitor: ScopeVisitor): void {}

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {}

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {
    const {
      expression,
      arguments: functionArguments,
      id,
    } = this.syntaxNode.data
    const { typeChecker } = visitor

    const calleeType = typeChecker.nodes[expression.data.id]

    /* Unify against these to enforce a function type */
    const placeholderReturnType: StaticType = {
      type: 'variable',
      value: typeChecker.typeNameGenerator.next(),
    }

    const placeholderArgTypes = functionArguments
      .map<FunctionArgument | undefined>(arg => {
        if (arg.type === 'placeholder') return

        return {
          label: arg.data.label,
          type: {
            type: 'variable',
            value: typeChecker.typeNameGenerator.next(),
          },
        }
      })
      .filter(nonNullable)

    const placeholderFunctionType: StaticType = {
      type: 'function',
      returnType: placeholderReturnType,
      arguments: placeholderArgTypes,
    }

    typeChecker.constraints.push({
      head: calleeType,
      tail: placeholderFunctionType,
      origin: this.syntaxNode,
    })

    typeChecker.nodes[id] = placeholderReturnType

    let argumentValues = functionArguments
      .map(arg =>
        arg.type === 'placeholder' ? undefined : arg.data.expression
      )
      .filter(nonNullable)

    const constraints = placeholderArgTypes.map((argType, i) => ({
      head: argType.type,
      tail: typeChecker.nodes[argumentValues[i].data.id],
      origin: this.syntaxNode,
    }))

    typeChecker.constraints = typeChecker.constraints.concat(constraints)
  }
}
