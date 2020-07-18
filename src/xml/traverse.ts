import { withOptions } from 'tree-visit'
import * as XML from './ast'

export function getChildrenElements(element: XML.Element): XML.Element[] {
  return element.content.flatMap(child =>
    child.type === 'element' ? [child.data] : []
  )
}

const { find, findAll } = withOptions({
  getChildren: getChildrenElements,
})

export function getChildrenElementsMap(
  element: XML.Element
): { [key: string]: XML.Element } {
  return getChildrenElements(element).reduce(
    (result: { [key: string]: XML.Element }, item: XML.Element) => {
      result[item.tag] = item
      return result
    },
    {}
  )
}

export function makeAttributeMap(
  attributes: XML.Attribute[]
): { [key: string]: string } {
  return attributes.reduce(
    (result: { [key: string]: string }, item: XML.Attribute) => {
      result[item.name] = item.value
      return result
    },
    {}
  )
}

export function getAttributes(element: XML.Element): { [key: string]: string } {
  return makeAttributeMap(element.attributes)
}

export function findElementByTag(
  root: XML.Element,
  tag: string
): XML.Element | undefined {
  return find(root, element => element.tag === tag)
}

export function findElementsByTag(
  root: XML.Element,
  tag: string
): XML.Element[] {
  return findAll(root, element => element.tag === tag)
}

export function flatMapContent(
  root: XML.Element,
  f: (content: XML.Content) => XML.Content[]
): XML.Element {
  return {
    ...root,
    content: root.content
      .flatMap(f)
      .map(child =>
        child.type === 'element'
          ? { type: child.type, data: flatMapContent(child.data, f) }
          : child
      ),
  }
}

export function filterContent(
  root: XML.Element,
  predicate: (content: XML.Content) => boolean
) {
  return flatMapContent(root, content => (predicate(content) ? [content] : []))
}

export function removeWhitespace(root: XML.Element) {
  return filterContent(
    root,
    content => content.type !== 'charData' || content.data.trim() !== ''
  )
}
