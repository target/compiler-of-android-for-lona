import * as XML from '../xml/ast'
import print from '../xml/print'

export const createColor = (name: string, value: string): XML.Element => {
  return {
    tag: 'color',
    attributes: [{ name: 'name', value: name }],
    content: [{ type: 'charData', data: value }],
  }
}

export const createDimen = (name: string, value: string): XML.Element => {
  return {
    tag: 'dimen',
    attributes: [{ name: 'name', value: name }],
    content: [{ type: 'charData', data: value }],
  }
}

export const createItem = (name: string, value: string): XML.Element => {
  return {
    tag: 'item',
    attributes: [{ name: 'name', value: name }],
    content: [{ type: 'charData', data: value }],
  }
}

export const createStyle = (
  name: string,
  items: XML.Element[]
): XML.Element => {
  return {
    tag: 'style',
    attributes: [{ name: 'name', value: name }],
    content: items.map(item => ({ type: 'element', data: item })),
  }
}

/**
 * Create a resource XML file using the following format:
 *
 * <?xml version="1.0" encoding="utf-8"?>
 * <resources>
 *     <color name="primary">#FF0000</color>
 * </resources>
 */
export const createFile = (resources: XML.Content[]): string => {
  const document: XML.Document = {
    prolog: {
      xmlDecl: {
        version: '1.0',
        encoding: 'utf-8',
      },
    },
    element: {
      tag: 'resources',
      attributes: [],
      content: resources,
    },
  }

  return print(document)
}
