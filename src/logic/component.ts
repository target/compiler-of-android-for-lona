import * as XML from '../xml/ast'
import { FunctionDeclaration } from './nodes/FunctionDeclaration'
import {
  createView,
  ViewOptions,
  createTextView,
  TextViewOptions,
  createConstraintLayout,
} from '../android/layoutResources'
import { AST } from '@lona/compiler/lib/helpers/logic-ast'
import { findNode } from './syntaxNode'
import { FunctionCallExpression } from './nodes/FunctionCallExpression'
import { IdentifierExpression } from './nodes/IdentifierExpression'
import { IExpression } from './nodes/interfaces'
import { EvaluationContext } from './evaluation'
import { Value, Decode } from './runtime/value'
import { LiteralExpression } from './nodes/LiteralExpression'
import { ArrayLiteral } from './nodes/literals'
import { PublicView } from '../kotlin/componentClass'

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
        const id = value && Decode.string(value)
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
      const background = value && Decode.color(value)
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
      case 'VerticalStack':
      case 'HorizontalStack': {
        const isHorizontal = callee.name === 'HorizontalStack'

        const primaryStartToStartConstraint = isHorizontal
          ? 'constraintStartToStartOf'
          : 'constraintTopToTopOf'
        const primaryStartToEndConstraint = isHorizontal
          ? 'constraintStartToEndOf'
          : 'constraintTopToBottomOf'
        const primaryEndToStartConstraint = isHorizontal
          ? 'constraintEndToStartOf'
          : 'constraintBottomToTopOf'
        const primaryEndToEndConstraint = isHorizontal
          ? 'constraintEndToEndOf'
          : 'constraintBottomToBottomOf'
        const primaryLayoutDimension = isHorizontal
          ? 'layoutWidth'
          : 'layoutHeight'
        const secondaryStartToStartConstraint = isHorizontal
          ? 'constraintTopToTopOf'
          : 'constraintStartToStartOf'
        const secondaryEndToEndConstraint = isHorizontal
          ? 'constraintBottomToBottomOf'
          : 'constraintEndToEndOf'
        const secondaryLayoutDimension = isHorizontal
          ? 'layoutHeight'
          : 'layoutWidth'

        // Start constraint
        children.forEach((child, index) => {
          if (index === 0) {
            child.options[primaryStartToStartConstraint] = 'parent'
          } else {
            child.options[
              primaryStartToEndConstraint
            ] = createAndroidIdReference(children[index - 1].id)
          }
        })

        // End constraint
        children.forEach((child, index, list) => {
          if (index < list.length - 1) {
            child.options[
              primaryEndToStartConstraint
            ] = createAndroidIdReference(children[index + 1].id)
          } else {
            child.options[primaryEndToEndConstraint] = 'parent'
          }
        })

        // Primary axis
        children.forEach(child => {
          if (!child.options[primaryLayoutDimension]) {
            child.options[primaryLayoutDimension] = '0dp'
          }
        })

        // Secondary axis
        children.forEach(child => {
          child.options[secondaryStartToStartConstraint] = 'parent'

          if (!child.options[secondaryLayoutDimension]) {
            child.options[secondaryEndToEndConstraint] = 'parent'
            child.options[secondaryLayoutDimension] = 'match_parent'
          }
        })

        return { id: id, type: 'View', options: viewOptions, children }
      }
      case 'Text': {
        const textViewOptions: TextViewOptions = { ...viewOptions }

        if ('value' in argumentExpressionNodes) {
          const expression = argumentExpressionNodes['value']
          const value = visitor.evaluation.evaluate(expression.id)
          const text = value && Decode.string(value)
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

type ElementTreeContext = {
  imports: string[]
  publicViews: PublicView[]
}

class ElementTreeVisitor {
  isRoot: boolean = true

  context: ElementTreeContext = {
    imports: [],
    publicViews: [],
  }

  addView(name: string, type: string, importPath: string) {
    const { imports, publicViews } = this.context

    if (!imports.includes(importPath)) {
      imports.push(importPath)
    }

    if (!publicViews.find(view => view.name === name)) {
      publicViews.push({
        name,
        type,
      })
    }
  }
}

function createElementTree(
  isRoot: boolean,
  visitor: ElementTreeVisitor,
  view: AndroidView
): XML.Element {
  switch (view.type) {
    case 'View': {
      const { id, options, children } = view

      visitor.addView(
        id,
        'ConstraintLayout',
        'androidx.constraintlayout.widget.ConstraintLayout'
      )

      if (isRoot) {
        return createConstraintLayout(
          {
            ...options,
            layoutHeight: options.layoutHeight ?? 'match_parent',
            layoutWidth: options.layoutWidth ?? 'match_parent',
            isRoot,
          },
          children.map(child => createElementTree(false, visitor, child))
        )
      } else {
        return createConstraintLayout(
          options,
          children.map(child => createElementTree(false, visitor, child))
        )
      }
    }
    case 'TextView': {
      const { id, options } = view

      visitor.addView(id, 'TextView', 'android.widget.TextView')

      return createTextView(options)
    }
  }
}

export function createLayout(
  { evaluationContext }: { evaluationContext: EvaluationContext },
  node: FunctionDeclaration
): { layout: XML.Element } & ElementTreeContext {
  const returnStatements = node.returnStatements

  if (returnStatements.length !== 1) {
    throw new Error('Expected a single return from component function')
  }

  const returnExpression = returnStatements[0].expression

  const componentVisitor = new ComponentVisitor(evaluationContext)

  const viewHierarchy = createViewHierarchy(componentVisitor, returnExpression)

  if (viewHierarchy.type !== 'View') {
    throw new Error('Only View is supported as the top level element (for now)')
  }

  const elementTreeVisitor = new ElementTreeVisitor()

  const layout = createElementTree(true, elementTreeVisitor, viewHierarchy)

  return {
    layout,
    ...elementTreeVisitor.context,
  }
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
