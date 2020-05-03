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

export function getAttributes(element: XML.Element): { [key: string]: string } {
  return element.attributes.reduce(
    (result: { [key: string]: string }, item: XML.Attribute) => {
      result[item.name] = item.value
      return result
    },
    {}
  )
}

export type TraversalControl = {
  stop: () => void
}

export function traverseElements(
  element: XML.Element,
  f: (element: XML.Element, control: TraversalControl) => void
) {
  let stopped = false

  const control = {
    stop: () => {
      stopped = true
    },
  }

  function inner(element: XML.Element) {
    if (stopped) return

    f(element, control)

    getChildrenElements(element).forEach(inner)
  }

  inner(element)
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
