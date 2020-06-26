import intersection from 'lodash.intersection'
import { LogicAST as AST } from '@lona/serialization'
import * as LogicScope from './scope'
import * as LogicTraversal from '@lona/compiler/lib/helpers/logic-traversal'
import { Reporter } from '@lona/compiler/lib/helpers/reporter'
import { ShallowMap } from '@lona/compiler/lib/utils/shallow-map'
import { assertNever } from '@lona/compiler/lib/utils/assert-never'
import { nonNullable } from '@lona/compiler/lib/utils/non-nullable'
import {
  StaticType,
  FunctionArgument,
  unit,
  bool,
  number,
  string,
  color,
} from './staticType'

import { Constraint, substitute } from './typeUnifier'

class LogicNameGenerator {
  private prefix: string
  private currentIndex = 0
  constructor(prefix: string = '') {
    this.prefix = prefix
  }
  next() {
    this.currentIndex += 1
    let name = this.currentIndex.toString(36)
    return `${this.prefix}${name}`
  }
}

export type UnificationContext = {
  constraints: Constraint[]
  nodes: { [key: string]: StaticType }
  patternTypes: { [key: string]: StaticType }
  typeNameGenerator: LogicNameGenerator
}

function unificationType(
  genericsInScope: [string, string][],
  getName: () => string,
  typeAnnotation: AST.TypeAnnotation
): StaticType {
  if (typeAnnotation.type === 'typeIdentifier') {
    const { string, isPlaceholder } = typeAnnotation.data.identifier
    if (isPlaceholder) {
      return {
        type: 'variable',
        value: getName(),
      }
    }
    const generic = genericsInScope.find(g => g[0] === string)
    if (generic) {
      return {
        type: 'generic',
        name: generic[1],
      }
    }
    const parameters = typeAnnotation.data.genericArguments.map(arg =>
      unificationType(genericsInScope, getName, arg)
    )
    return {
      type: 'constant',
      name: string,
      parameters,
    }
  }
  if (typeAnnotation.type === 'placeholder') {
    return {
      type: 'variable',
      value: getName(),
    }
  }
  return {
    type: 'variable',
    value: 'Function type error',
  }
}

function genericNames(type: StaticType): string[] {
  if (type.type === 'variable') {
    return []
  }
  if (type.type === 'constant') {
    return type.parameters
      .map(genericNames)
      .reduce((prev, x) => prev.concat(x), [])
  }
  if (type.type === 'generic') {
    return [type.name]
  }
  if (type.type === 'function') {
    return type.arguments
      .map(x => x.type)
      .concat(type.returnType)
      .map(genericNames)
      .reduce((prev, x) => prev.concat(x), [])
  }
  assertNever(type)
}

function replaceGenericsWithVars(getName: () => string, type: StaticType) {
  let substitution = new ShallowMap<StaticType, StaticType>()

  genericNames(type).forEach(name =>
    substitution.set(
      { type: 'generic', name },
      { type: 'variable', value: getName() }
    )
  )

  return substitute(substitution, type)
}

function specificIdentifierType(
  scopeContext: LogicScope.Scope,
  unificationContext: UnificationContext,
  id: string
): StaticType {
  const patternId =
    scopeContext.identifierExpressionToPattern[id] ||
    scopeContext.memberExpressionToPattern[id]

  if (!patternId) {
    return {
      type: 'variable',
      value: unificationContext.typeNameGenerator.next(),
    }
  }

  const scopedType = unificationContext.patternTypes[patternId]

  if (!scopedType) {
    return {
      type: 'variable',
      value: unificationContext.typeNameGenerator.next(),
    }
  }

  return replaceGenericsWithVars(
    () => unificationContext.typeNameGenerator.next(),
    scopedType
  )
}

const makeEmptyContext = (): UnificationContext => ({
  constraints: [],
  nodes: {},
  patternTypes: {},
  typeNameGenerator: new LogicNameGenerator('?'),
})

export const makeUnificationContext = (
  rootNode: AST.SyntaxNode,
  scopeContext: LogicScope.Scope,
  reporter: Reporter,
  initialContext: UnificationContext = makeEmptyContext()
): UnificationContext => {
  const build = (
    result: UnificationContext,
    node: AST.SyntaxNode,
    config: LogicTraversal.TraversalConfig
  ): UnificationContext => {
    config.needsRevisitAfterTraversingChildren = true

    switch (node.type) {
      case 'branch': {
        if (!config._isRevisit) {
          // the condition needs to be a Boolean
          result.nodes[node.data.condition.data.id] = bool
        }
        break
      }
      case 'loop': {
        if (!config._isRevisit) {
          // the condition needs to be a Boolean
          result.nodes[node.data.expression.data.id] = bool
        }
        break
      }
      case 'record': {
        if (!config._isRevisit) {
          // a record is a function with itself as a return type, and a few parameters

          const genericNames = node.data.genericParameters
            .map(param =>
              param.type === 'parameter' ? param.data.name.name : undefined
            )
            .filter(nonNullable)
          const genericsInScope = genericNames.map(x => [
            x,
            result.typeNameGenerator.next(),
          ])
          const universalTypes = genericNames.map<StaticType>((x, i) => ({
            type: 'generic',
            name: genericsInScope[i][1],
          }))

          let parameterTypes: FunctionArgument[] = []

          node.data.declarations.forEach(declaration => {
            if (
              declaration.type !== 'variable' ||
              !declaration.data.annotation
            ) {
              return
            }
            const { annotation, name } = declaration.data
            const annotationType = unificationType(
              [],
              () => result.typeNameGenerator.next(),
              annotation
            )
            parameterTypes.unshift({
              label: name.name,
              type: annotationType,
            })

            result.nodes[name.id] = annotationType
            result.patternTypes[name.id] = annotationType
          })

          const returnType: StaticType = {
            type: 'constant',
            name: node.data.name.name,
            parameters: universalTypes,
          }
          const functionType: StaticType = {
            type: 'function',
            returnType,
            arguments: parameterTypes,
          }

          result.nodes[node.data.name.id] = functionType
          result.patternTypes[node.data.name.id] = functionType
        }
        break
      }
      case 'enumeration': {
        if (!config._isRevisit) {
          const genericNames = node.data.genericParameters
            .map(param =>
              param.type === 'parameter' ? param.data.name.name : undefined
            )
            .filter(nonNullable)
          const genericsInScope: [string, string][] = genericNames.map(x => [
            x,
            result.typeNameGenerator.next(),
          ])
          const universalTypes = genericNames.map<StaticType>((x, i) => ({
            type: 'generic',
            name: genericsInScope[i][1],
          }))

          const returnType: StaticType = {
            type: 'constant',
            name: node.data.name.name,
            parameters: universalTypes,
          }

          node.data.cases.forEach(enumCase => {
            if (enumCase.type === 'placeholder') {
              return
            }
            const parameterTypes = enumCase.data.associatedValueTypes
              .map(annotation => {
                if (annotation.type === 'placeholder') {
                  return
                }
                return {
                  label: undefined,
                  type: unificationType(
                    genericsInScope,
                    () => result.typeNameGenerator.next(),
                    annotation
                  ),
                }
              })
              .filter(nonNullable)
            const functionType: StaticType = {
              type: 'function',
              returnType,
              arguments: parameterTypes,
            }

            result.nodes[enumCase.data.name.id] = functionType
            result.patternTypes[enumCase.data.name.id] = functionType
          })

          /* Not used for unification, but used for convenience in evaluation */
          result.nodes[node.data.name.id] = returnType
          result.patternTypes[node.data.name.id] = returnType
        }
        break
      }
      case 'function': {
        if (!config._isRevisit) {
          const genericNames = node.data.genericParameters
            .map(param =>
              param.type === 'parameter' ? param.data.name.name : undefined
            )
            .filter(nonNullable)
          const genericsInScope: [string, string][] = genericNames.map(x => [
            x,
            result.typeNameGenerator.next(),
          ])

          let parameterTypes: FunctionArgument[] = []

          node.data.parameters.forEach(param => {
            if (param.type === 'placeholder') {
              return
            }
            const { name, id } = param.data.localName
            let annotationType = unificationType(
              [],
              () => result.typeNameGenerator.next(),
              param.data.annotation
            )
            parameterTypes.unshift({ label: name, type: annotationType })

            result.nodes[id] = annotationType
            result.patternTypes[id] = annotationType
          })

          let returnType = unificationType(
            genericsInScope,
            () => result.typeNameGenerator.next(),
            node.data.returnType
          )
          let functionType: StaticType = {
            type: 'function',
            returnType,
            arguments: parameterTypes,
          }

          result.nodes[node.data.name.id] = functionType
          result.patternTypes[node.data.name.id] = functionType
        } else {
          // const returnStatements = node.data.block.filter(
          //   x => x.type === 'return'
          // ) as AST.ReturnStatement[]
          // const functionType = result.nodes[node.data.name.id]
          // if (functionType.type === 'function') {
          //   returnStatements.forEach(returnStatement => {
          //     const returnType = returnStatement
          //       ? result.nodes[returnStatement.data.expression.data.id]
          //       : undefined
          //     if (returnType) {
          //       result.constraints.push({
          //         head: functionType.returnType,
          //         tail: returnType,
          //         origin: node,
          //       })
          //     }
          //   })
          // }
        }
        break
      }
      case 'variable': {
        if (config._isRevisit) {
          if (
            !node.data.initializer ||
            !node.data.annotation ||
            node.data.annotation.type === 'placeholder'
          ) {
            config.ignoreChildren = true
          } else {
            const annotationType = unificationType(
              [],
              () => result.typeNameGenerator.next(),
              node.data.annotation
            )
            const initializerId = node.data.initializer.data.id
            const initializerType = result.nodes[initializerId]

            if (initializerType) {
              result.constraints.push({
                head: annotationType,
                tail: initializerType,
                origin: node,
              })
            } else {
              reporter.error(
                `WARNING: No initializer type for ${node.data.name.name} (${initializerId})`
              )
            }

            result.patternTypes[node.data.name.id] = annotationType
          }
        }
        break
      }
      case 'placeholder': {
        if (config._isRevisit) {
          result.nodes[node.data.id] = {
            type: 'variable',
            value: result.typeNameGenerator.next(),
          }
        }
        break
      }
      case 'identifierExpression': {
        if (config._isRevisit) {
          let type = specificIdentifierType(
            scopeContext,
            result,
            node.data.identifier.id
          )

          result.nodes[node.data.id] = type
          result.nodes[node.data.identifier.id] = type
        }
        break
      }
      case 'functionCallExpression': {
        if (config._isRevisit) {
          const calleeType = result.nodes[node.data.expression.data.id]

          /* Unify against these to enforce a function type */

          const placeholderReturnType: StaticType = {
            type: 'variable',
            value: result.typeNameGenerator.next(),
          }

          const placeholderArgTypes = node.data.arguments
            .map<FunctionArgument | undefined>(arg => {
              if (arg.type === 'placeholder') {
                return
              }
              return {
                label: arg.data.label,
                type: {
                  type: 'variable',
                  value: result.typeNameGenerator.next(),
                },
              }
            })
            .filter(nonNullable)

          const placeholderFunctionType: StaticType = {
            type: 'function',
            returnType: placeholderReturnType,
            arguments: placeholderArgTypes,
          }

          result.constraints.push({
            head: calleeType,
            tail: placeholderFunctionType,
            origin: node,
          })

          result.nodes[node.data.id] = placeholderReturnType

          let argumentValues = node.data.arguments
            .map(arg =>
              arg.type === 'placeholder' ? undefined : arg.data.expression
            )
            .filter(nonNullable)

          const constraints = placeholderArgTypes.map((argType, i) => ({
            head: argType.type,
            tail: result.nodes[argumentValues[i].data.id],
            origin: node,
          }))

          result.constraints = result.constraints.concat(constraints)
        }
        break
      }
      case 'memberExpression': {
        if (!config._isRevisit) {
          config.ignoreChildren = true
        } else {
          const type = specificIdentifierType(
            scopeContext,
            result,
            node.data.id
          )
          result.nodes[node.data.id] = type
        }
        break
      }
      case 'literalExpression': {
        if (config._isRevisit) {
          result.nodes[node.data.id] = result.nodes[node.data.literal.data.id]
        }
        break
      }
      case 'none': {
        if (config._isRevisit) {
          result.nodes[node.data.id] = unit
        }
        break
      }
      case 'boolean': {
        if (config._isRevisit) {
          result.nodes[node.data.id] = bool
        }
        break
      }
      case 'number': {
        if (config._isRevisit) {
          result.nodes[node.data.id] = number
        }
        break
      }
      case 'string': {
        if (config._isRevisit) {
          result.nodes[node.data.id] = string
        }
        break
      }
      case 'color': {
        if (config._isRevisit) {
          result.nodes[node.data.id] = color
        }
        break
      }
      case 'array': {
        if (config._isRevisit) {
          const elementType: StaticType = {
            type: 'variable',
            value: result.typeNameGenerator.next(),
          }
          result.nodes[node.data.id] = {
            type: 'constant',
            name: 'Array',
            parameters: [elementType],
          }

          const constraints = node.data.value.map(expression => ({
            head: elementType,
            tail: result.nodes[expression.data.id] || {
              type: 'variable',
              value: result.typeNameGenerator.next(),
            },
            origin: node,
          }))

          result.constraints = result.constraints.concat(constraints)
        }
        break
      }
      case 'return': {
        // already handled in the revisit of the function declaration
        break
      }
      case 'parameter': {
        // already handled in the function call
        break
      }
      case 'functionType':
      case 'typeIdentifier':
      case 'declaration':
      case 'importDeclaration':
      case 'namespace':
      case 'assignmentExpression':
      case 'program':
      case 'enumerationCase':
      case 'value':
      case 'topLevelDeclarations':
      case 'topLevelParameters':
      case 'argument':
      case 'expression': {
        break
      }
      default: {
        assertNever(node)
      }
    }

    return result
  }

  return LogicTraversal.reduce(rootNode, build, initialContext)
}
