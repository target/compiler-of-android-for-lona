import * as XML from '../xml'

export type GlobalVariableDefinition = {
  id: string
  value: string
}

// Format:
//
// <globals>
//     <global id="topOut" value="." />
//     <global id="mavenUrl" value="mavenCentral" />
//     <global id="buildToolsVersion" value="${buildApi}" />
// </globals>
export function getGlobals(root: XML.Element): GlobalVariableDefinition[] {
  const elements = XML.findElementsByTag(root, 'global')

  return elements.map(element => {
    const { id, value } = XML.getAttributes(element)

    return { id, value }
  })
}
