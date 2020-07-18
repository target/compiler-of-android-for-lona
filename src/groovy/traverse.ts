import { withOptions, IndexPath } from 'tree-visit'
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

const { visit, accessPath, find } = withOptions({
  getChildren: getChildrenNodes,
})

export function findBlockByName(
  root: AST.Node,
  blockName: string
): AST.Block | undefined {
  return find(
    root,
    element => element.type === 'block' && element.name === blockName
  ) as AST.Block | undefined
}

export function findBlockByPath(
  root: AST.Node,
  blockPath: string[]
): AST.Block | undefined {
  let found: AST.Block | undefined

  visit(root, (element, indexPath) => {
    const elementPath = accessPath(root, indexPath).flatMap(node =>
      node.type === 'block' ? [node.name] : []
    )

    if (isDeepStrictEqual(blockPath, elementPath)) {
      found = element as AST.Block
      return 'stop'
    }
  })

  return found
}
