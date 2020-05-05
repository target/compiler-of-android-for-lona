import * as XML from '../xml/ast'
import {
  getAttributes,
  findElementByTag,
  findElementsByTag,
} from '../xml/traverse'

// <?xml version="1.0"?>
// <template
//     format="5"
//     revision="2"
//     name="Android Project"
//     description="Creates a new Android project.">
//     <category value="Application" />
//     <parameter
//         id="makeIgnore"
//         name="Create .gitignore file"
//         type="boolean"
//         default="true" />
//     <thumbs>
//         <thumb>android-module.png</thumb>
//     </thumbs>
//     <globals file="globals.xml.ftl" />
//     <execute file="recipe.xml.ftl" />
// </template>

export type ConfigParameter = {
  id: string
  name: string
  type: string
  default: string
}

export type Config = {
  format: string
  revision: string
  name: string
  description: string
  category: string
  parameters: ConfigParameter[]
  globals: string
  execute: string
}

function getParameter(element: XML.Element): ConfigParameter {
  const attributes = getAttributes(element)

  return {
    id: attributes.id,
    name: attributes.name,
    type: attributes.type,
    default: attributes.default,
  }
}

export function getConfig(root: XML.Element): Config {
  const attributes = getAttributes(root)

  const globals = findElementByTag(root, 'globals')
  if (!globals) {
    throw new Error('Template is missing globals element')
  }

  const execute = findElementByTag(root, 'execute')
  if (!execute) {
    throw new Error('Template is missing execute element')
  }

  const category = findElementByTag(root, 'category')
  const categoryValue = category ? getAttributes(category).value : ''

  const parameters = findElementsByTag(root, 'parameter').map(getParameter)

  return {
    format: attributes.format || '',
    revision: attributes.revision || '',
    name: attributes.name || '',
    description: attributes.description || '',
    category: categoryValue,
    parameters,
    globals: getAttributes(globals).file,
    execute: getAttributes(execute).file,
  }
}
