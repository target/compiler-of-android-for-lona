import * as XML from '../xml/ast'
import { FunctionDeclaration } from './nodes/FunctionDeclaration'
import {
  createView,
  ViewOptions,
  createTextView,
  TextViewOptions,
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

class ComponentVisitor {
  evaluation: EvaluationContext
  intrinsicNameCount: { [key: string]: number } = {}

  constructor(evaluation: EvaluationContext) {
    this.evaluation = evaluation
  }

  private createIntrinsicNameCount(type: string): number {
    const count = this.intrinsicNameCount[type] || 1

    this.intrinsicNameCount[type] = count + 1

    return count
  }

  createIntrinsicName(type: string): string {
    const count = this.createIntrinsicNameCount(type)

    return count === 1 ? type.toLowerCase() : `${type.toLowerCase()}${count}`
  }
}

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

type AndroidView =
  | {
      id: string
      type: 'View'
      options: ViewOptions
      children: AndroidView[]
    }
  | {
      id: string
      type: 'TextView'
      options: TextViewOptions
    }

const createAndroidId = (string: string) => `@+id/${string}`
const createAndroidIdReference = (string: string) => `@id/${string}`

function createViewHierarchy(
  visitor: ComponentVisitor,
  node: IExpression
): AndroidView {
  if (node instanceof FunctionCallExpression) {
    const { callee, argumentExpressionNodes } = node

    if (!(callee instanceof IdentifierExpression)) {
      throw new Error('Element function must be an identifier (for now)')
    }

    function getViewName(): string | undefined {
      if ('__name' in argumentExpressionNodes) {
        const expression = argumentExpressionNodes['__name']
        const value = visitor.evaluation.evaluate(expression.id)
        const id = value && getString(value)
        return id
      }
    }

    const id =
      getViewName()?.toLowerCase() || visitor.createIntrinsicName(callee.name)

    let viewOptions: ViewOptions = {
      id: createAndroidId(id),
    }

    let children: AndroidView[] = []

    if ('width' in argumentExpressionNodes) {
      const expression = argumentExpressionNodes['width']
      const value = visitor.evaluation.evaluate(expression.id)
      const dimensionSize = value && getDimensionSize(value)
      viewOptions.layoutWidth =
        dimensionSize && convertDimensionSize(dimensionSize)
    }

    if ('height' in argumentExpressionNodes) {
      const expression = argumentExpressionNodes['height']
      const value = visitor.evaluation.evaluate(expression.id)
      const dimensionSize = value && getDimensionSize(value)
      viewOptions.layoutHeight =
        dimensionSize && convertDimensionSize(dimensionSize)
    }

    if ('backgroundColor' in argumentExpressionNodes) {
      const expression = argumentExpressionNodes['backgroundColor']
      const value = visitor.evaluation.evaluate(expression.id)
      const background = value && getColor(value)
      viewOptions.background = background
    }

    if ('children' in argumentExpressionNodes) {
      const expression = argumentExpressionNodes['children']

      const literal =
        expression instanceof LiteralExpression && expression.literal

      if (literal instanceof ArrayLiteral) {
        children = literal.elements.map(expression =>
          createViewHierarchy(visitor, expression)
        )
      }
    }

    switch (callee.name) {
      case 'View': {
        return { id: id, type: 'View', options: viewOptions, children }
      }
      case 'HorizontalStack': {
        // Start constraint
        children.forEach((child, index) => {
          if (index === 0) {
            child.options.constraintStartToStartOf = 'parent'
          } else {
            child.options.constraintStartToEndOf = createAndroidIdReference(
              children[index - 1].id
            )
          }
        })

        // End constraint
        children.forEach((child, index, list) => {
          if (index < list.length - 1) {
            child.options.constraintEndToStartOf = createAndroidIdReference(
              children[index + 1].id
            )
          } else {
            child.options.constraintEndToEndOf = 'parent'
          }
        })

        // Secondary axis constraint
        children.forEach(child => {
          child.options.constraintTopToTopOf = 'parent'

          if (!child.options.layoutHeight) {
            child.options.constraintBottomToBottomOf = 'parent'
          }
        })

        return { id: id, type: 'View', options: viewOptions, children }
      }
      case 'Text': {
        const textViewOptions: TextViewOptions = { ...viewOptions }

        if ('value' in argumentExpressionNodes) {
          const expression = argumentExpressionNodes['value']
          const value = visitor.evaluation.evaluate(expression.id)
          const text = value && getString(value)
          if (text) {
            textViewOptions.text = text
          }
        }

        return { id: id, type: 'TextView', options: textViewOptions }
      }
      default:
        throw new Error(`Unknown element name: ${callee.name}`)
    }
  }

  throw new Error('Unhandled element')
}

function createElementTree(view: AndroidView): XML.Element {
  switch (view.type) {
    case 'View': {
      const { options, children } = view
      return createView(options, children.map(createElementTree))
    }
    case 'TextView': {
      const { options } = view
      return createTextView(options)
    }
  }
}

export function createLayout(
  { evaluationContext }: { evaluationContext: EvaluationContext },
  node: FunctionDeclaration
): XML.Element {
  const returnStatements = node.returnStatements

  if (returnStatements.length !== 1) {
    throw new Error('Expected a single return from component function')
  }

  const returnExpression = returnStatements[0].expression

  const visitor = new ComponentVisitor(evaluationContext)

  const viewHierarchy = createViewHierarchy(visitor, returnExpression)

  return createElementTree(viewHierarchy)
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
