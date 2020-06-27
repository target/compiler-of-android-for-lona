import { declarationPathTo } from '@lona/compiler/lib/helpers/logic-ast'
import { Reporter } from '@lona/compiler/lib/helpers/reporter'
import { assertNever } from '@lona/compiler/lib/utils/assert-never'
import { nonNullable } from '@lona/compiler/lib/utils/non-nullable'
import { ShallowMap } from '@lona/compiler/lib/utils/shallow-map'
import { LogicAST as AST } from '@lona/serialization'
import { Value, StandardLibrary } from './runtime/value'
import { Scope } from './scope'
import * as StaticType from './staticType'
import { TypeChecker } from './typeChecker'
import { substitute, Substitution } from './typeUnifier'
import { createNode, createEvaluationVisitor } from './nodes/createNode'

const STANDARD_LIBRARY = 'standard library'

function evaluateIsTrue(
  context: EvaluationContext,
  expression: AST.Expression
) {
  const condition = context.evaluate(expression.data.id)
  return (
    (condition &&
      condition.type.type === 'constant' &&
      condition.type.name === 'Boolean' &&
      condition.memory.type === 'bool' &&
      condition.memory.value) ||
    false
  )
}

type Thunk = {
  label: string
  dependencies: string[]
  f: (args: Value[]) => Value
}

export class EvaluationVisitor {
  evaluation: EvaluationContext
  rootNode: AST.SyntaxNode
  scope: Scope
  reporter: Reporter
  typeChecker: TypeChecker
  substitution: Substitution

  constructor(
    rootNode: AST.SyntaxNode,
    scope: Scope,
    typeChecker: TypeChecker,
    substitution: Substitution,
    reporter: Reporter
  ) {
    this.evaluation = new EvaluationContext(reporter)
    this.rootNode = rootNode
    this.scope = scope
    this.reporter = reporter
    this.typeChecker = typeChecker
    this.substitution = substitution
  }

  add(uuid: string, thunk: Thunk) {
    this.evaluation.add(uuid, thunk)
  }

  addValue(uuid: string, value: Value) {
    this.evaluation.addValue(uuid, value)
  }
}

/**
 * The evaluation context of the Lona Workspace.
 */
export class EvaluationContext {
  values: { [uuid: string]: Value } = {}
  thunks: { [uuid: string]: Thunk } = {}
  reporter?: Reporter

  constructor(reporter?: Reporter) {
    this.reporter = reporter
  }

  add(uuid: string, thunk: Thunk) {
    this.thunks[uuid] = thunk
  }

  addValue(uuid: string, value: Value) {
    this.values[uuid] = value
  }

  /**
   * Evaluate the id to a value, resolving any dependency along the way
   */
  evaluate(uuid: string): Value | undefined {
    const value = this.values[uuid]

    if (value) return value

    const thunk = this.thunks[uuid]

    if (!thunk) {
      this.reporter?.error(`no thunk for ${uuid}`)
      return undefined
    }

    const resolvedDependencies = thunk.dependencies.map(x => this.evaluate(x))

    if (resolvedDependencies.some(x => !x)) {
      this.reporter?.error(
        `Failed to evaluate thunk ${uuid} (${thunk.label}) - missing dep ${
          thunk.dependencies[resolvedDependencies.findIndex(x => !x)]
        }`
      )
      return undefined
    }

    const result = thunk.f(resolvedDependencies as Value[])
    this.values[uuid] = result

    return result
  }

  copy() {
    const newContext = new EvaluationContext(this.reporter)
    newContext.thunks = { ...this.thunks }
    newContext.values = { ...this.values }
    return newContext
  }
}

export const evaluate = (
  node: AST.SyntaxNode,
  visitor: EvaluationVisitor
): EvaluationContext | undefined => {
  const {
    rootNode,
    scope,
    typeChecker,
    substitution,
    reporter,
    evaluation: initialContext,
  } = visitor

  // TODO: Handle stopping
  const context = AST.subNodes(node).reduce<EvaluationContext | undefined>(
    (prev, subNode) => {
      if (!prev) {
        return undefined
      }
      return evaluate(subNode, visitor)
    },
    initialContext
  )

  if (!context) {
    return undefined
  }

  switch (node.type) {
    case 'identifierExpression':
    case 'none':
    case 'boolean':
    case 'number':
    case 'string':
    case 'color':
    case 'array':
    case 'literalExpression':
    case 'memberExpression':
      const visitorNode = createEvaluationVisitor(node)

      if (visitorNode) {
        visitorNode.evaluationEnter(visitor)
      }

      break
    case 'functionCallExpression': {
      const { expression, arguments: args } = node.data
      let functionType = typeChecker.nodes[expression.data.id]
      if (!functionType) {
        reporter.error('Unknown type of functionCallExpression')
        break
      }

      const resolvedType = substitute(substitution, functionType)
      if (resolvedType.type !== 'function') {
        reporter.error(
          'Invalid functionCallExpression type (only functions are valid)',
          resolvedType
        )
        break
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

      // if (
      //   expression.type === 'identifierExpression' &&
      //   expression.data.identifier.string === 'View'
      // ) {
      //   console.log(
      //     dependencies,
      //     expression,
      //     scopeContext.expressionToPattern[expression.data.id]
      //   )
      // }

      visitor.add(node.data.id, {
        label: 'FunctionCallExpression',
        dependencies,
        f: values => {
          const [functionValue, ...functionArgs] = values

          if (functionValue.memory.type !== 'function') {
            reporter.error(
              'tried to evaluate a function that is not a function'
            )
            return { type: StaticType.unit, memory: { type: 'unit' } }
          }

          if (functionValue.memory.value.type === 'path') {
            const functionName = functionValue.memory.value.value.join('.')

            // console.log('evaluating function', functionValue.memory.value.value)

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
              `Failed to evaluate "${node.data.id}": Unknown function ${functionName}`
            )
            return { type: StaticType.unit, memory: { type: 'unit' } }
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
                  x.type === 'argument' &&
                  !!x.data.label &&
                  x.data.label === key
              )
              let argumentValue: Value | void

              if (arg && arg.type === 'argument') {
                const { expression } = arg.data
                if (
                  expression.type !== 'identifierExpression' ||
                  !expression.data.identifier.isPlaceholder
                ) {
                  const dependencyIndex = dependencies.indexOf(
                    expression.data.id
                  )

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
      break
    }
    case 'variable': {
      if (node.data.initializer) {
        visitor.add(node.data.name.id, {
          label: 'Variable initializer for ' + node.data.name.name,
          dependencies: [node.data.initializer.data.id],
          f: values => values[0],
        })
      }
      break
    }
    case 'function': {
      const { name, block, parameters } = node.data
      const type = typeChecker.patternTypes[name.id]
      const fullPath = declarationPathTo(rootNode, node.data.id)

      // if (name.name === 'View') {
      //   console.log('evaluate', inspect(node, false, 5, true))
      // }

      if (!type) {
        reporter.error('Unknown function type')
        break
      }

      visitor.addValue(name.id, {
        type,
        memory: {
          type: 'function',
          value: {
            type: 'path',
            value: fullPath,
            evaluate(...args: Value[]) {
              const newContext = context.copy()
              parameters.forEach((p, i) => {
                newContext.addValue(p.data.id, args[i])
                if (p.type === 'parameter') {
                  newContext.addValue(p.data.localName.id, args[i])
                }
              })

              function evaluateBlock(
                block: AST.Statement[]
              ): Value | undefined {
                for (let statement of block) {
                  switch (statement.type) {
                    case 'branch': {
                      if (
                        evaluateIsTrue(newContext, statement.data.condition)
                      ) {
                        const res = evaluateBlock(statement.data.block)
                        if (res) {
                          return res
                        }
                      }
                      break
                    }
                    case 'placeholder':
                    case 'expression':
                    case 'declaration': {
                      break
                    }
                    case 'loop': {
                      while (
                        evaluateIsTrue(newContext, statement.data.expression)
                      ) {
                        const res = evaluateBlock(statement.data.block)
                        if (res) {
                          return res
                        }
                      }
                    }
                    case 'return': {
                      return newContext.evaluate(
                        statement.data.expression.data.id
                      )
                    }
                  }
                }
              }

              return evaluateBlock(block)
            },
          },
        },
      })

      break
    }
    case 'record': {
      const { name, declarations } = node.data
      const type = typeChecker.patternTypes[name.id]
      if (!type) {
        reporter.error('Unknown record type')
        break
      }
      const resolvedType = substitute(substitution, type)
      const dependencies = declarations
        .map(x =>
          x.type === 'variable' && x.data.initializer
            ? x.data.initializer.data.id
            : undefined
        )
        .filter(nonNullable)

      visitor.add(name.id, {
        label: 'Record declaration for ' + name.name,
        dependencies,
        f: values => {
          const parameterTypes: {
            [key: string]: [StaticType.StaticType, Value | void]
          } = {}
          let index = 0

          declarations.forEach(declaration => {
            if (declaration.type !== 'variable') {
              return
            }
            const parameterType =
              typeChecker.patternTypes[declaration.data.name.id]
            if (!parameterType) {
              return
            }

            let initialValue: Value | void
            if (declaration.data.initializer) {
              initialValue = values[index]
              index += 1
            }

            parameterTypes[declaration.data.name.name] = [
              parameterType,
              initialValue,
            ]
          })

          return {
            type: resolvedType,
            memory: {
              type: 'function',
              value: {
                type: 'recordInit',
                value: parameterTypes,
              },
            },
          }
        },
      })

      break
    }
    case 'enumeration': {
      const type = typeChecker.patternTypes[node.data.name.id]

      if (!type) {
        reporter.error('unknown enumberation type')
        break
      }
      node.data.cases.forEach(enumCase => {
        if (enumCase.type !== 'enumerationCase') {
          return
        }
        const resolvedConsType = substitute(substitution, type)
        const { name } = enumCase.data
        visitor.addValue(name.id, {
          type: resolvedConsType,
          memory: {
            type: 'function',
            value: {
              type: 'enumInit',
              value: name.name,
            },
          },
        })
      })

      break
    }
    case 'assignmentExpression': {
      visitor.add(node.data.left.data.id, {
        label:
          'Assignment for ' +
          declarationPathTo(rootNode, node.data.left.data.id).join('.'),
        dependencies: [node.data.right.data.id],
        f: values => values[0],
      })
      break
    }
    case 'functionType':
    case 'typeIdentifier':
    case 'program':
    case 'parameter':
    case 'value':
    case 'topLevelParameters':
    case 'topLevelDeclarations':
    case 'enumerationCase': // handled in 'enumeration'
    case 'argument': // handled in 'functionCallExpression'
    case 'namespace':
    case 'importDeclaration':
    case 'placeholder':
    case 'return': // handled in 'function'
    case 'loop': // handled in 'function'
    case 'branch': // handled in 'function'
    case 'expression':
    case 'declaration': {
      break
    }
    default: {
      assertNever(node)
    }
  }

  return context
}
