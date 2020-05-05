import util from 'util'
import escapeRegExp from 'lodash.escaperegexp'
import ProgramNode from 'freemarker-parser/src/nodes/ProgramNode'
import TextNode from 'freemarker-parser/src/nodes/TextNode'
import ConditionNode from 'freemarker-parser/src/nodes/ConditionNode'
import InterpolationNode from 'freemarker-parser/src/nodes/InterpolationNode'
import ListNode from 'freemarker-parser/src/nodes/ListNode'
import AbstractBodyNode from 'freemarker-parser/src/nodes/abstract/AbstractBodyNode'
import ParamNames from 'freemarker-parser/src/enum/ParamNames'
import {
  Compound,
  Expression,
  Identifier,
  Literal,
  CallExpression,
  UnaryExpression,
  LogicalExpression,
  BuiltInExpression,
  BinaryExpression,
} from 'freemarker-parser/src/interface/Params'

export type Context = {
  data: any
}

export function evaluateCondition(
  node: ConditionNode,
  context: Context
): string {
  const { params } = node

  return params && evaluateExpression(params, context)
    ? evaluateBody(node.consequent, context)
    : node.alternate
    ? evaluateBody(node.alternate, context)
    : ''
}

export function evaluateExpression(
  unclassified: Expression,
  context: Context
): any {
  const { type } = unclassified

  switch (type) {
    case 'Identifier': {
      const expression = unclassified as Identifier

      if (!(expression.name in context.data)) {
        console.log('missing field', expression.name)
      }

      return context.data[expression.name]
    }
    case 'Literal': {
      const expression = unclassified as Literal

      return expression.value
    }
    case 'UnaryExpression': {
      const expression = unclassified as UnaryExpression
      switch (expression.operator) {
        case '??':
          return !!evaluateExpression(expression.argument, context)
        case '!':
          return !evaluateExpression(expression.argument, context)
      }
      console.log('Unhandled unary expression', expression)
      return null
    }
    case 'CallExpression': {
      const expression = unclassified as CallExpression
      const callee = evaluateExpression(expression.callee, context)
      const args = expression.arguments.map(arg =>
        evaluateExpression(arg, context)
      )
      if (typeof callee === 'function') {
        return callee.apply(context, args)
      }
      console.error(
        `Attempted to call non-function: ${callee}\n\nAST:\n${JSON.stringify(
          expression.callee
        )}`
      )
      return null
    }
    case 'BuiltInExpression': {
      const expression = unclassified as BuiltInExpression
      const { left, right, operator } = expression
      // const name = (left as Identifier).name as BuiltInMethodName

      const method: CallExpression =
        right.type === ParamNames.Identifier
          ? {
              type: ParamNames.CallExpression,
              callee: right,
              arguments: [],
            }
          : (right as CallExpression)

      const name = (method.callee as Identifier).name

      if (!name || operator !== '?') {
        console.error('Unhandled built-in expression', unclassified)
        return null
      }

      // const evaluatedObject = evaluateExpression(left, context)
      // const evaluatedArguments = method.arguments.map(arg =>
      //   evaluateExpression(arg, context)
      // )

      switch (name) {
        case 'replace':
          const value = evaluateExpression(left, context)
          const [original, replacement, flags] = method.arguments.map(arg =>
            evaluateExpression(arg, context)
          )
          const result = value.replace(
            new RegExp(escapeRegExp(original), flags),
            replacement
          )
          return result
        case 'has_content': {
          const value = evaluateExpression(left, context)
          const typeName = {}.toString.call(value).slice(8, -1)
          switch (typeName) {
            case 'String':
              return value !== ''
            case 'Boolean':
              return value !== false
            case 'Number':
              return value !== 0
            case 'Array':
              return value.length !== 0
            default:
              return !!typeName
          }
        }
        case 'string': {
          return evaluateExpression(left, context).toString()
        }
        case 'matches': {
          const value = evaluateExpression(left, context)
          const raw = (method.arguments[0] as Literal).raw
          const regexp = new RegExp(JSON.parse(raw))
          // console.log(
          //   'MATCHES',
          //   util.inspect(unclassified, false, null, true),
          //   regexp,
          //   raw,
          //   evaluatedObject
          // )
          return regexp.test(value)
        }
        default:
          console.error('Unhandled built-in expression', name)
          return null
      }
    }
    case 'BinaryExpression': {
      const expression = unclassified as BinaryExpression
      const { left, right, operator } = expression
      switch (operator) {
        case '!=':
          return !!(
            evaluateExpression(left, context) !=
            evaluateExpression(right, context)
          )
        case '==':
          return !!(
            evaluateExpression(left, context) ==
            evaluateExpression(right, context)
          )
        case 'gt':
        case '>':
          return (
            evaluateExpression(left, context) >
            evaluateExpression(right, context)
          )
        case 'gte':
        case '>=':
          return (
            evaluateExpression(left, context) >=
            evaluateExpression(right, context)
          )
        case 'lt':
        case '<':
          return (
            evaluateExpression(left, context) <
            evaluateExpression(right, context)
          )
        case 'lte':
        case '<=':
          return (
            evaluateExpression(left, context) <=
            evaluateExpression(right, context)
          )
        default:
          console.error('Unhandled binary expression', unclassified)
      }
    }
    case 'LogicalExpression': {
      const expression = unclassified as LogicalExpression
      const { left, right, operator } = expression
      switch (operator) {
        case '||':
          return !!(
            evaluateExpression(left, context) ||
            evaluateExpression(right, context)
          )
        case '&&':
          return !!(
            evaluateExpression(left, context) &&
            evaluateExpression(right, context)
          )
        default:
          console.error('Unhandled logical expression', unclassified)
      }
    }
    default:
      console.error('Unhandled expression', unclassified)
  }
}

// InterpolationNode {
//   type: 'Interpolation',
//   params: {
//     type: 'CallExpression',
//     arguments: [ { type: 'Identifier', name: 'topOut' } ],
//     callee: { type: 'Identifier', name: 'escapeXmlAttribute' }
//   }
// },
export function evaluateInterpolation(
  node: InterpolationNode,
  context: Context
): string {
  return node.params ? evaluateExpression(node.params, context) : ''
}

// {
//   type: 'List',
//   params: {
//     type: 'Compound',
//     body: [
//       { type: 'Identifier', name: 'dependencyList' },
//       { type: 'Identifier', name: 'as' },
//       { type: 'Identifier', name: 'dependency' }
//     ]
//   },
//   body: [],
// }
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

  // Set up child scope
  const scopeValue = context.data[identifier]
  context.data[identifier] = variable

  const result = evaluateBody(node.body, context)

  // Restore parent scope
  context.data[identifier] = scopeValue

  return result
}

export function evaluateBody(
  nodes: AbstractBodyNode[],
  context: Context
): string {
  return nodes
    .map(unclassified => {
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
    })
    .join('')
}

export function evaluate(program: ProgramNode, context: Context): string {
  return evaluateBody(program.body || [], context)
}

export { ProgramNode }
