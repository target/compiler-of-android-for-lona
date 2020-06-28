import * as XML from '../xml/ast'
import { FunctionDeclaration } from './nodes/FunctionDeclaration'
import {
  createView,
  ViewOptions,
  createTextView,
} from '../android/layoutResources'
import { AST } from '@lona/compiler/lib/helpers/logic-ast'
import { findNode } from './syntaxNode'
import { FunctionCallExpression } from './nodes/FunctionCallExpression'
import { IdentifierExpression } from './nodes/IdentifierExpression'
import { IExpression } from './nodes/interfaces'
import { EvaluationContext } from './evaluation'
import { Value } from './runtime/value'
import { LiteralExpression } from './nodes/LiteralExpression'
import { ArrayLiteral } from './nodes/literals'

type ComponentContext = { evaluationContext: EvaluationContext }

type DimensionSize =
  | {
      type: 'fixed'
      value: number
    }
  | { type: 'flexible' }

function getString({ type, memory }: Value): string | undefined {
  if (
    type.type === 'constant' &&
    type.name === 'String' &&
    memory.type === 'string'
  ) {
    return memory.value
  }
}

function getColor({ type, memory }: Value): string | undefined {
  if (
    type.type === 'constant' &&
    type.name === 'Color' &&
    memory.type === 'record'
  ) {
    const colorValue = memory.value['value']
    return getString(colorValue)
  }
}

function getDimensionSize({ type, memory }: Value): DimensionSize | undefined {
  if (
    type.type === 'constant' &&
    type.name === 'DimensionSize' &&
    memory.type === 'enum'
  ) {
    const { value, data } = memory

    switch (value) {
      case 'fixed':
        if (data.length !== 1 || data[0].memory.type !== 'number') {
          throw new Error(`Bad DimensionSize data: ${JSON.stringify(data)}`)
        }

        return { type: value, value: data[0].memory.value }
      case 'flexible':
        return { type: value }
      default:
        throw new Error(`Bad DimensionSize case: ${value}`)
    }
  }
}

function convertDimensionSize(
  dimensionSize: DimensionSize
): string | undefined {
  switch (dimensionSize.type) {
    case 'fixed':
      return `${dimensionSize.value}dp`
    case 'flexible':
      return 'match_parent'
    default:
      break
  }
}

export function createElementTree(
  context: ComponentContext,
  node: IExpression
): XML.Element {
  if (node instanceof FunctionCallExpression) {
    const { callee, argumentExpressionNodes } = node

    let viewOptions: ViewOptions = {}

    if ('width' in argumentExpressionNodes) {
      const expression = argumentExpressionNodes['width']
      const value = context.evaluationContext.evaluate(expression.id)
      const dimensionSize = value && getDimensionSize(value)
      viewOptions.layoutWidth =
        dimensionSize && convertDimensionSize(dimensionSize)
    }

    if ('height' in argumentExpressionNodes) {
      const expression = argumentExpressionNodes['height']
      const value = context.evaluationContext.evaluate(expression.id)
      const dimensionSize = value && getDimensionSize(value)
      viewOptions.layoutHeight =
        dimensionSize && convertDimensionSize(dimensionSize)
    }

    if ('backgroundColor' in argumentExpressionNodes) {
      const expression = argumentExpressionNodes['backgroundColor']
      const value = context.evaluationContext.evaluate(expression.id)
      const background = value && getColor(value)
      viewOptions.background = background
    }

    if ('children' in argumentExpressionNodes) {
      const expression = argumentExpressionNodes['children']

      const literal =
        expression instanceof LiteralExpression && expression.literal

      if (literal instanceof ArrayLiteral) {
        console.log(literal.children)
      }
    }

    if (callee instanceof IdentifierExpression) {
      switch (callee.name) {
        case 'View':
          return createView(viewOptions, [])
        case 'Text':
          return createTextView(viewOptions)
        default:
          throw new Error(`Unknown callee name: ${callee.name}`)
      }
    }
  }

  throw new Error('Unhandled element')
}

export function createLayout(
  context: ComponentContext,
  node: FunctionDeclaration
): XML.Element {
  const returnStatements = node.returnStatements

  if (returnStatements.length !== 1) {
    throw new Error('Expected a single return from component function')
  }

  const returnExpression = returnStatements[0].expression

  return createElementTree(context, returnExpression)
}

export function findComponentFunction(
  node: AST.SyntaxNode
): FunctionDeclaration | undefined {
  const syntaxNode = findNode(node, child => child.type === 'function') as
    | AST.FunctionDeclaration
    | undefined

  if (syntaxNode) {
    const node = new FunctionDeclaration(syntaxNode)
    return node
  }
}
