import { parseString } from 'xml2js'
import * as XML from './ast'

type RawNode = {
  _?: string
  '#name': string
  $?: { [key: string]: string }
  $$?: RawNode[]
}

type NormalizedNode = {
  text?: string
  name: string
  attributes: { [key: string]: string }
  elements: NormalizedNode[]
}

function normalize(node: RawNode): NormalizedNode {
  return {
    text: node._,
    name: node['#name'],
    attributes: node.$ || {},
    elements: (node.$$ || []).map(normalize),
  }
}

function toElement(node: NormalizedNode): XML.Element {
  const { name, attributes, elements } = node

  return {
    tag: name,
    attributes: Object.entries(attributes).map(
      ([key, value]): XML.Attribute => ({
        name: key,
        value,
      })
    ),
    content: elements.map(
      (element: NormalizedNode): XML.Content => {
        if (element.name === '__text__') {
          return {
            type: 'charData',
            data: element.text || '',
          }
        } else {
          return {
            type: 'element',
            data: toElement(element),
          }
        }
      }
    ),
  }
}

/**
 * Parse an XML string
 */
export function parse(xmlString: string): XML.Element {
  let parsed: { [key: string]: RawNode } | undefined
  let error: Error | undefined

  parseString(
    xmlString,
    {
      charsAsChildren: true,
      explicitArray: true,
      explicitRoot: true,
      explicitChildren: true,
      preserveChildrenOrder: true,
      includeWhiteChars: true,
    },
    (err, result) => {
      error = err
      parsed = result
    }
  )

  if (!parsed) {
    throw new Error('Failed to parse XML, but no error was thrown')
  }

  if (error) {
    throw error
  }

  const root: RawNode = Object.values(parsed)[0]

  const normalized: NormalizedNode = normalize(root)

  return toElement(normalized)
}
