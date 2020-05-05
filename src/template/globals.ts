import * as XML from '../xml'

type GlobalVariableDefinition = {
  id: string
  value: string | boolean
}

export type Globals = { [key: string]: any }

export function parse(root: XML.Element): Globals {
  const elements = XML.findElementsByTag(root, 'global')

  const definitions: GlobalVariableDefinition[] = elements.map(element => {
    const { id, value, type } = XML.getAttributes(element)

    return { id, value: type === 'boolean' ? value == 'true' : value }
  })

  return definitions.reduce(
    (result: Globals, item: GlobalVariableDefinition) => {
      result[item.id] = item.value
      return result
    },
    {}
  )
}
