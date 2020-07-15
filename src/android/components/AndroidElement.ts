import * as XML from '../../xml/ast'
import {
  ViewOptions,
  TextViewOptions,
  createConstraintLayout,
  createTextView,
} from '../layoutResources'
import { ElementTreeVisitor } from './ElementTreeVisitor'
import { IExpression } from '../../logic/nodes/interfaces'
import { DynamicAttribute } from '../../kotlin/componentClass'
import { IdentifierExpression } from '../../logic/nodes/IdentifierExpression'

export interface AndroidElement {
  id: string
  options: ViewOptions
  children: AndroidElement[]
  className: string
  importName: string

  getXMLElement(
    visitor: ElementTreeVisitor,
    children: XML.Element[]
  ): XML.Element
}

export class AndroidView implements AndroidElement {
  id: string
  options: ViewOptions
  children: AndroidElement[]
  className = 'ConstraintLayout'
  importName = 'androidx.constraintlayout.widget.ConstraintLayout'

  constructor(id: string, options: ViewOptions, children: AndroidElement[]) {
    this.id = id
    this.options = options
    this.children = children
  }

  getXMLElement(visitor: ElementTreeVisitor, children: XML.Element[]) {
    const { id, options } = this

    visitor.addView(
      id,
      'ConstraintLayout',
      'androidx.constraintlayout.widget.ConstraintLayout',
      []
    )

    if (visitor.isRoot) {
      return createConstraintLayout(
        {
          ...options,
          layoutHeight: options.layoutHeight ?? 'match_parent',
          layoutWidth: options.layoutWidth ?? 'match_parent',
          isRoot: true,
        },
        children
      )
    } else {
      return createConstraintLayout(options, children)
    }
  }
}

export class AndroidTextView implements AndroidElement {
  id: string
  options: TextViewOptions
  children = []
  className = 'TextView'
  importName = 'android.widget.TextView'

  constructor(id: string, options: TextViewOptions) {
    this.id = id
    this.options = options
  }

  getXMLElement(
    visitor: ElementTreeVisitor,
    children: XML.Element[]
  ): XML.Element {
    const { id, options } = this

    visitor.addView(
      id,
      'TextView',
      'android.widget.TextView',
      Object.entries(
        visitor.getAttributeAssignments(id)
      ).map(([key, expression]) => convertAssignment(id, key, expression))
    )

    return createTextView(options)
  }
}

export function convertAssignment(
  viewId: string,
  key: string,
  expression: IExpression
): DynamicAttribute {
  let value: string = ''

  if (expression instanceof IdentifierExpression) {
    value = expression.name
  }

  return { name: `${viewId}View.${key}`, value }
}
