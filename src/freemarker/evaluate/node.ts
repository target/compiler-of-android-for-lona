import TextNode from 'freemarker-parser/dist/nodes/TextNode'
import ConditionNode from 'freemarker-parser/dist/nodes/ConditionNode'
import InterpolationNode from 'freemarker-parser/dist/nodes/InterpolationNode'
import ListNode from 'freemarker-parser/dist/nodes/ListNode'
import AbstractBodyNode from 'freemarker-parser/dist/nodes/abstract/AbstractBodyNode'
import ParamNames from 'freemarker-parser/dist/enum/ParamNames'
import { Compound, Identifier } from 'freemarker-parser/dist/interface/Params'
import { Context } from '../context'
import { evaluateExpression } from './expression'

export function evaluateCondition(
  node: ConditionNode,
  context: Context
): string {
  const { params } = node

  return params && evaluateExpression(params, context)
    ? evaluateNodes(node.consequent, context)
    : node.alternate
    ? evaluateNodes(node.alternate, context)
    : ''
}

export function evaluateInterpolation(
  node: InterpolationNode,
  context: Context
): string {
  return node.params ? evaluateExpression(node.params, context) : ''
}

export function evaluateList(node: ListNode, context: Context): string {
  if (node.params?.type !== ParamNames.Compound) {
    console.error('Bad list node', node)
    return ''
  }

  const compound = node.params as Compound
  const identifiers = compound.body as Identifier[]

  const [
    { name: variable },
    { name: operator },
    { name: identifier },
  ] = identifiers

  if (operator !== 'as') {
    console.error('Bad list node', node)
    return ''
  }

  // Save parent scope variable, if one exists
  const savedParentScopeValue = context.get(identifier)

  const listValue = evaluateExpression(identifiers[0], context)

  let result = ''

  if (!Array.isArray(listValue)) {
    console.error('Non-list value used in <#list>:', listValue, node)
    return result
  }

  listValue.forEach(element => {
    context.set(identifier, element)
    result += evaluateNodes(node.body, context)
  })

  // Restore parent scope variable
  context.set(identifier, savedParentScopeValue)

  return result
}

export function evaluateNode(
  unclassified: AbstractBodyNode,
  context: Context
): string {
  switch (unclassified.type) {
    case 'Text': {
      const node = unclassified as TextNode
      return node.text
    }
    case 'Condition': {
      const node = unclassified as ConditionNode
      return evaluateCondition(node, context)
    }
    case 'Interpolation': {
      const node = unclassified as InterpolationNode
      return evaluateInterpolation(node, context)
    }
    case 'List': {
      const node = unclassified as ListNode
      return evaluateList(node, context)
    }
    default:
      console.error(
        `Node not handled: ${
          unclassified
          // util.inspect(unclassified, false, null, true)
        }`
      )
      return ''
  }
}

export function evaluateNodes(
  nodes: AbstractBodyNode[],
  context: Context
): string {
  return nodes.map(node => evaluateNode(node, context)).join('')
}
