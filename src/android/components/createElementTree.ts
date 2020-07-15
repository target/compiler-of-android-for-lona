import * as XML from '../../xml/ast'
import { ElementTreeVisitor } from './ElementTreeVisitor'
import { AndroidElement } from './AndroidElement'
import { PublicView } from '../../kotlin/componentClass'
import { EvaluationContext } from '../../logic/evaluation'
import { FunctionDeclaration } from '../../logic/nodes/FunctionDeclaration'
import { ComponentVisitor } from '../../logic/components/ComponentVisitor'
import { createViewHierarchy } from '../../logic/component'
import { LonaView } from '../../logic/components/LonaView'

export type ElementTreeContext = {
  imports: string[]
  publicViews: PublicView[]
}

export function createElementTree(
  visitor: ElementTreeVisitor,
  view: AndroidElement
): XML.Element {
  const { children } = view

  visitor.elementPath.push(view)

  const xmlElements = children.map(child => createElementTree(visitor, child))

  visitor.elementPath.pop()

  const xmlElement = view.getXMLElement(visitor, xmlElements)

  return xmlElement
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

  if (!(viewHierarchy instanceof LonaView)) {
    throw new Error('Only View is supported as the top level element (for now)')
  }

  const elementTreeVisitor = new ElementTreeVisitor(
    componentVisitor.componentContext
  )

  const layout = createElementTree(
    elementTreeVisitor,
    viewHierarchy.androidElement
  )

  return {
    layout,
    ...elementTreeVisitor.elementTreeContext,
  }
}
