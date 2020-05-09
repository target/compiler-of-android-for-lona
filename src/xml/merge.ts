import * as XML from './ast'
import { TraversalControl, getChildrenElements } from './traverse'
import groupBy from 'lodash.groupby'

export type AttributeMerger = (
  a: XML.Attribute | undefined,
  b: XML.Attribute | undefined
) => XML.Attribute | undefined

export function mergeAttributes(
  source: XML.Attribute[],
  target: XML.Attribute[],
  merger: AttributeMerger
): XML.Attribute[] {
  const uniqueNames = Array.from(
    new Set([
      ...source.map(attr => attr.name),
      ...target.map(attr => attr.name),
    ])
  )

  return uniqueNames.reduce((result: XML.Attribute[], name) => {
    const merged = merger(
      source.find(attr => attr.name === name),
      target.find(attr => attr.name === name)
    )
    if (merged) {
      result.push(merged)
    }
    return result
  }, [])
}

export const MERGE_ATTRIBUTES_CHOOSE_SOURCE: AttributeMerger = (
  source,
  target
) => source || target

export const MERGE_ATTRIBUTES_CHOOSE_TARGET: AttributeMerger = (
  source,
  target
) => target || source

export function mergeContentByTagName(
  content: XML.Content[],
  attributeMerger: AttributeMerger
): XML.Content[] {
  const elementMap = groupBy(
    content.flatMap(item => (item.type === 'element' ? [item.data] : [])),
    'tag'
  )

  const replaced: { [key: string]: boolean } = {}

  return content.flatMap((item): XML.Content[] => {
    if (item.type !== 'element') return [item]

    if (replaced[item.data.tag]) return []

    replaced[item.data.tag] = true

    const baseElement: XML.Element = {
      tag: item.data.tag,
      attributes: [],
      content: [],
    }

    const mergedElement: XML.Element = elementMap[item.data.tag].reduce(
      (result, next) => {
        return {
          tag: item.data.tag,
          attributes: mergeAttributes(
            result.attributes,
            next.attributes,
            attributeMerger
          ),
          content: [...result.content, ...next.content],
        }
      },
      baseElement
    )

    return [{ type: 'element', data: mergedElement }]
  })
}

export function mergeElementsByTagName(
  source: XML.Element,
  target: XML.Element,
  attributeMerger: AttributeMerger
): XML.Element {
  if (source.tag !== target.tag) {
    console.error('mergeElements called with mismatching XML elements')
    return source
  }

  return {
    tag: source.tag,
    attributes: mergeAttributes(
      source.attributes,
      target.attributes,
      attributeMerger
    ),
    content: mergeContentByTagName(
      [...source.content, ...target.content],
      attributeMerger
    ),
  }
}
