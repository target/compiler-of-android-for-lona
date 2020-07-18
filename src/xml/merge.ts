import groupBy from 'lodash.groupby'
import * as XML from './ast'
import { getAttributes } from './traverse'

export type AttributeMerger = (
  a: XML.Attribute | undefined,
  b: XML.Attribute | undefined
) => XML.Attribute | undefined

export function mergeAttributes(
  source: XML.Attribute[],
  target: XML.Attribute[],
  attributeMerger: AttributeMerger
): XML.Attribute[] {
  const uniqueNames = Array.from(
    new Set([
      ...source.map(attr => attr.name),
      ...target.map(attr => attr.name),
    ])
  )

  return uniqueNames.reduce((result: XML.Attribute[], name) => {
    const merged = attributeMerger(
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

function mergeElementsBasic(
  source: XML.Element,
  target: XML.Element,
  attributeMerger: AttributeMerger
): XML.Element {
  return {
    tag: source.tag,
    attributes: mergeAttributes(
      source.attributes,
      target.attributes,
      attributeMerger
    ),
    content: [...source.content, ...target.content],
  }
}

/**
 * Merge all elements with the same tag.
 *
 * @param content
 * @param attributeMerger
 */
export function mergeContentByTagName(
  content: XML.Content[],
  attributeMerger: AttributeMerger
): XML.Content[] {
  const elementMap = groupBy(
    content.flatMap(item => (item.type === 'element' ? [item.data] : [])),
    element => element.tag
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
      (result, next) => mergeElementsBasic(result, next, attributeMerger),
      baseElement
    )

    return [{ type: 'element', data: mergedElement }]
  })
}

/**
 * Keep only the first element for each (tag, attributeName) pair
 *
 * @param content
 * @param attributeName
 */
export function mergeContentByUniqueAttribute(
  content: XML.Content[],
  attributeName: string
): XML.Content[] {
  const elements = content.flatMap(item =>
    item.type === 'element' ? [item.data] : []
  )

  function firstElement(
    tag: string,
    attributeValue: string
  ): XML.Element | undefined {
    return elements.find(element =>
      element.tag === tag &&
      getAttributes(element)[attributeName] === attributeValue
        ? element
        : undefined
    )
  }

  return content.flatMap((item): XML.Content[] => {
    if (item.type !== 'element') return [item]

    // Keep only the first element for a the specified tag and attribute name
    return item.data ===
      firstElement(item.data.tag, getAttributes(item.data)[attributeName])
      ? [item]
      : []
  })
}

export function mergeElementsByTagName(
  source: XML.Element,
  target: XML.Element,
  attributeMerger: AttributeMerger
): XML.Element {
  if (source.tag !== target.tag) {
    console.error('mergeElementsByTagName called with mismatching XML elements')
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

export function mergeElementsByUniqueAttribute(
  source: XML.Element,
  target: XML.Element,
  attributeMerger: AttributeMerger,
  attributeName: string
): XML.Element {
  if (source.tag !== target.tag) {
    console.error(
      'mergeElementsByUniqueAttribute called with mismatching XML elements'
    )
    return source
  }

  return {
    tag: source.tag,
    attributes: mergeAttributes(
      source.attributes,
      target.attributes,
      attributeMerger
    ),
    content: mergeContentByUniqueAttribute(
      [...source.content, ...target.content],
      attributeName
    ),
  }
}
