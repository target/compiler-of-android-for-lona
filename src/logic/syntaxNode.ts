import {
  TraversalConfig,
  emptyConfig,
  reduce,
} from '@lona/compiler/lib/helpers/logic-traversal'
import { AST } from '@lona/compiler/lib/helpers/logic-ast'

// TODO: Reduce isn't returning a value correctly
export function findNode(
  rootNode: AST.SyntaxNode,
  predicate: (node: AST.SyntaxNode) => boolean
): AST.SyntaxNode | undefined {
  let found: AST.SyntaxNode | undefined

  reduce(
    rootNode,
    (_result, node, config) => {
      if (!found && predicate(node)) {
        config.stopTraversal = true
        found = node
      }
      return undefined
    },
    undefined
  )

  return found
}

export function forEach(
  rootNode: AST.SyntaxNode,
  config: TraversalConfig,
  f: (node: AST.SyntaxNode, config: TraversalConfig) => void
) {
  reduce(
    rootNode,
    (_result, node, config) => {
      f(node, config)
      return undefined
    },
    undefined,
    config
  )
}

export const Traversal = {
  get preorder(): TraversalConfig {
    return {
      ...emptyConfig(),
      order: 'PreOrder' as TraversalConfig['order'],
    }
  },
}
