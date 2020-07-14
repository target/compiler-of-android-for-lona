import { createFs, IFS } from 'buffs'
import upperFirst from 'lodash.upperfirst'
import path from 'path'
import { formatDrawableName } from '../android/drawableResources'
import { createLayoutFile } from '../android/layoutResources'
import { createComponentClass } from '../kotlin/componentClass'
import {
  ComponentParameter,
  convertComponentParameter,
} from '../kotlin/componentParameter'
import { createLayout, findComponentFunction } from '../android/component'
import { ModuleContext } from '../logic/module'
import * as XML from '../xml/ast'
import {
  createAttr,
  createStyleableDeclaration,
} from '../android/valueResources'
import { compact } from '../utils/sequence'
import snakeCase from 'lodash.snakecase'

export function convertComponentFiles(
  moduleContext: ModuleContext,
  packageName: string
): { layoutResources: IFS; componentFiles: IFS; attrResources: XML.Element[] } {
  const { componentFiles, evaluationContext } = moduleContext

  const { fs: layoutResources } = createFs()
  const { fs: components } = createFs()
  const attrResources: XML.Element[] = []

  componentFiles.forEach(({ sourcePath, rootNode }) => {
    const componentFunction = findComponentFunction(rootNode)

    if (!componentFunction) return

    const parameters = componentFunction.parameters

    const componentParameters: ComponentParameter[] = parameters.map(
      parameter => convertComponentParameter(moduleContext, parameter)
    )

    const basename = path.basename(sourcePath)
    const componentName = upperFirst(
      path.basename(sourcePath, path.extname(sourcePath))
    )
    const className = `${componentName}View`

    const attrs: XML.Element[] = compact(
      componentParameters.map(parameter => {
        if (parameter.styleableAttribute) {
          return createAttr(
            snakeCase(parameter.name),
            parameter.styleableAttribute.format
          )
        }
      })
    )

    if (attrs.length > 0) {
      attrResources.push(createStyleableDeclaration(className, attrs))
    }

    const { layout, imports, publicViews } = createLayout(
      { evaluationContext },
      componentFunction
    )

    const componentClass = createComponentClass({
      namePrefix: componentName,
      packagePath: packageName,
      imports,
      parameters: componentParameters,
      publicViews,
    })
    const kotlinFileName = `${className}.kt`
    components.writeFileSync(`/${kotlinFileName}`, componentClass)

    const layoutFile = createLayoutFile(layout)
    const xmlFileName = formatDrawableName(basename, 'xml', {
      nameTemplate: '${qualifiedName?join("-")}',
    })
    layoutResources.writeFileSync(`/${xmlFileName}`, layoutFile)
  })

  return { layoutResources, componentFiles: components, attrResources }
}
