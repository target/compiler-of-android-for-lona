import { IExpression } from '../../logic/nodes/interfaces'
import { DynamicAttribute } from '../../kotlin/componentClass'
import { ComponentContext } from '../../logic/component'
import { AndroidElement } from './AndroidElement'
import { ElementTreeContext } from './createElementTree'

export class ElementTreeVisitor {
  elementPath: AndroidElement[] = []
  componentContext: ComponentContext
  elementTreeContext: ElementTreeContext = {
    imports: [],
    publicViews: [],
  }

  constructor(componentContext: ComponentContext) {
    this.componentContext = componentContext
  }

  get isRoot(): boolean {
    return this.elementPath.length === 0
  }

  addView(
    name: string,
    type: string,
    importPath: string,
    dynamicAttributes: DynamicAttribute[]
  ) {
    const { imports, publicViews } = this.elementTreeContext

    if (!imports.includes(importPath)) {
      imports.push(importPath)
    }

    if (!publicViews.find(view => view.name === name)) {
      publicViews.push({
        name,
        type,
        dynamicAttributes,
      })
    }
  }

  getAttributeAssignments(viewId: string): { [key: string]: IExpression } {
    return this.componentContext.viewAttributeAssignment[viewId] || {}
  }
}
