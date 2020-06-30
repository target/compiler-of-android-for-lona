import * as XML from './ast'

export function getChildrenElements(element: XML.Element): XML.Element[] {
  return element.content.flatMap(child =>
    child.type === 'element' ? [child.data] : []
  )
}

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

export type TraversalControl = {
  stop: () => void
  ancestors: XML.Element[]
}

export function traverseElements(
  element: XML.Element,
  f: (element: XML.Element, control: TraversalControl) => void
) {
  let stopped = false

  const control: TraversalControl = {
    stop: () => {
      stopped = true
    },
    ancestors: [],
  }

  function inner(element: XML.Element) {
    if (stopped) return

    control.ancestors.push(element)

    f(element, control)

    getChildrenElements(element).forEach(inner)

    control.ancestors.pop()
  }

  inner(element)
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

export function findElement(
  root: XML.Element,
  predicate: (element: XML.Element) => boolean
): XML.Element | undefined {
  let found: XML.Element | undefined

  traverseElements(root, (element, control) => {
    if (predicate(element)) {
      found = element
      control.stop()
    }
  })

  return found
}

export function findElements(
  root: XML.Element,
  predicate: (element: XML.Element) => boolean
): XML.Element[] {
  const found: XML.Element[] = []

  traverseElements(root, element => {
    if (predicate(element)) {
      found.push(element)
    }
  })

  return found
}

export function findElementByTag(
  root: XML.Element,
  tag: string
): XML.Element | undefined {
  return findElement(root, element => element.tag === tag)
}

export function findElementsByTag(
  root: XML.Element,
  tag: string
): XML.Element[] {
  return findElements(root, element => element.tag === tag)
}
