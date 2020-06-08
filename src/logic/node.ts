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
    (result, node, config) => {
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
