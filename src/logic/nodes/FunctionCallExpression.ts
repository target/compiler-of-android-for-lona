import { nonNullable } from '@lona/compiler/lib/utils/non-nullable'
import { LogicAST as AST } from '@lona/serialization'
import { ScopeVisitor } from '../scopeVisitor'
import { IExpression } from './interfaces'
import { TypeCheckerVisitor } from '../typeChecker'
import { StaticType, FunctionArgument, unit } from '../staticType'
import { EvaluationVisitor } from '../evaluate'
import { substitute } from '../typeUnifier'
import { Value } from '../runtime/value'
import { assertNever } from '@lona/compiler/lib/utils'

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

  evaluationEnter(visitor: EvaluationVisitor) {
    const { expression, arguments: args, id } = this.syntaxNode.data
    const { typeChecker, reporter, substitution } = visitor

    let functionType = typeChecker.nodes[expression.data.id]
    if (!functionType) {
      reporter.error('Unknown type of functionCallExpression')
      return
    }

    const resolvedType = substitute(substitution, functionType)
    if (resolvedType.type !== 'function') {
      reporter.error(
        'Invalid functionCallExpression type (only functions are valid)',
        resolvedType
      )
      return
    }

    const dependencies = [expression.data.id].concat(
      args
        .map(arg => {
          if (
            arg.type === 'placeholder' ||
            arg.data.expression.type === 'placeholder' ||
            (arg.data.expression.type === 'identifierExpression' &&
              arg.data.expression.data.identifier.isPlaceholder)
          ) {
            return undefined
          }
          return arg.data.expression.data.id
        })
        .filter(nonNullable)
    )

    visitor.add(id, {
      label: 'FunctionCallExpression',
      dependencies,
      f: values => {
        const [functionValue, ...functionArgs] = values

        if (functionValue.memory.type !== 'function') {
          reporter.error('tried to evaluate a function that is not a function')
          return { type: unit, memory: { type: 'unit' } }
        }

        if (functionValue.memory.value.type === 'path') {
          const functionName = functionValue.memory.value.value.join('.')

          // if (
          //   context.isFromStandardLibrary(expression.data.id) &&
          //   isHardcodedMapCall.functionCallExpression(functionName, hardcoded)
          // ) {
          //   const value = hardcoded.functionCallExpression[functionName](
          //     node,
          //     ...functionArgs
          //   )
          //   if (value) {
          //     return value
          //   }
          // }

          // we have a custom function
          // let's try to evaluate it
          const value = functionValue.memory.value.evaluate(...functionArgs)

          if (value) {
            return value
          }

          // we tried and we have no idea what it is
          // so let's warn about it and ignore it
          reporter.error(
            `Failed to evaluate "${id}": Unknown function ${functionName}`
          )
          return { type: unit, memory: { type: 'unit' } }
        }

        if (functionValue.memory.value.type === 'enumInit') {
          return {
            type: resolvedType.returnType,
            memory: {
              type: 'enum',
              value: functionValue.memory.value.value,
              data: functionArgs,
            },
          }
        }

        if (functionValue.memory.value.type === 'recordInit') {
          const members: [string, Value | void][] = Object.entries(
            functionValue.memory.value.value
          ).map(([key, value]) => {
            const arg = args.find(
              x =>
                x.type === 'argument' && !!x.data.label && x.data.label === key
            )
            let argumentValue: Value | void

            if (arg && arg.type === 'argument') {
              const { expression } = arg.data
              if (
                expression.type !== 'identifierExpression' ||
                !expression.data.identifier.isPlaceholder
              ) {
                const dependencyIndex = dependencies.indexOf(expression.data.id)

                if (dependencyIndex !== -1) {
                  argumentValue = values[dependencyIndex]
                }
              }
            }

            if (argumentValue) {
              return [key, argumentValue]
            }
            return [key, value[1]]
          })

          return {
            type: resolvedType.returnType,
            memory: {
              type: 'record',
              value: members.reduce<{ [field: string]: Value }>((prev, m) => {
                if (!m[1]) {
                  return prev
                }
                prev[m[0]] = m[1]
                return prev
              }, {}),
            },
          }
        }

        assertNever(functionValue.memory.value)
      },
    })
  }
}
