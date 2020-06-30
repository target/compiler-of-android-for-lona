import * as AST from './ast'
import { isDeepStrictEqual } from 'util'

export function getChildrenNodes(node: AST.Node): AST.Node[] {
  switch (node.type) {
    case 'program':
    case 'block':
      return node.content
    case 'content':
      return []
  }
}

export type TraversalControl = {
  stop: () => void
  ancestors: AST.Node[]
}

export function traverseNodes(
  element: AST.Node,
  f: (element: AST.Node, control: TraversalControl) => void
) {
  let stopped = false

  const control: TraversalControl = {
    stop: () => {
      stopped = true
    },
    ancestors: [],
  }

  function inner(element: AST.Node) {
    if (stopped) return

    control.ancestors.push(element)

    f(element, control)

    getChildrenNodes(element).forEach(inner)

    control.ancestors.pop()
  }

  inner(element)
}

export function findNode(
  root: AST.Node,
  predicate: (element: AST.Node) => boolean
): AST.Node | undefined {
  let found: AST.Node | undefined

  traverseNodes(root, (element, control) => {
    if (predicate(element)) {
      found = element
      control.stop()
    }
  })

  return found
}

export function findNodes(
  root: AST.Node,
  predicate: (element: AST.Node) => boolean
): AST.Node[] {
  const found: AST.Node[] = []

  traverseNodes(root, element => {
    if (predicate(element)) {
      found.push(element)
    }
  })

  return found
}

export function findBlockByName(
  root: AST.Node,
  blockName: string
): AST.Block | undefined {
  return findNode(
    root,
    element => element.type === 'block' && element.name === blockName
  ) as AST.Block | undefined
}

export function findBlockByPath(
  root: AST.Node,
  blockPath: string[]
): AST.Block | undefined {
  let found: AST.Block | undefined

  traverseNodes(root, (element, control) => {
    const currentPath = control.ancestors.flatMap(node =>
      node.type === 'block' ? [node.name] : []
    )

    if (isDeepStrictEqual(blockPath, currentPath)) {
      found = element as AST.Block
      control.stop()
    }
  })

  return found
}
