import escapeRegExp from 'lodash.escaperegexp'
import ParamNames from 'freemarker-parser/dist/enum/ParamNames'
import {
  Expression,
  Identifier,
  Literal,
  CallExpression,
  UnaryExpression,
  LogicalExpression,
  BuiltInExpression,
  BinaryExpression,
} from 'freemarker-parser/dist/interface/Params'
import { Context } from '../context'

export function evaluateLiteral(expression: Literal, context: Context): any {
  return expression.value
}

export function evaluateIdentifier(
  expression: Identifier,
  context: Context
): any {
  if (!context.has(expression.name)) {
    console.error('Undefined identifier in .ftl:', expression.name)
  }

  return context.get(expression.name)
}

export function evaluateUnaryExpression(
  expression: UnaryExpression,
  context: Context
): any {
  switch (expression.operator) {
    case '??':
      return !!evaluateExpression(expression.argument, context)
    case '!':
      return !evaluateExpression(expression.argument, context)
  }

  console.error('Unhandled unary expression', expression)

  return undefined
}

export function evaluateCallExpression(
  expression: CallExpression,
  context: Context
): any {
  const callee = evaluateExpression(expression.callee, context)

  const args = expression.arguments.map(arg => evaluateExpression(arg, context))

  if (typeof callee === 'function') {
    return callee.apply(context, args)
  }

  console.error(
    `Attempted to call non-function: ${callee}\n\nAST:\n${JSON.stringify(
      expression.callee
    )}`
  )

  return undefined
}

export function evaluateLogicalExpression(
  expression: LogicalExpression,
  context: Context
): any {
  const { left, right, operator } = expression

  switch (operator) {
    case '||':
      return !!(
        evaluateExpression(left, context) || evaluateExpression(right, context)
      )
    case '&&':
      return !!(
        evaluateExpression(left, context) && evaluateExpression(right, context)
      )
    default:
      console.error('Unhandled logical expression', expression)
      return undefined
  }
}

export function evaluateBinaryExpression(
  expression: BinaryExpression,
  context: Context
): any {
  const { left, right, operator } = expression
  switch (operator) {
    case '!=':
      return !!(
        evaluateExpression(left, context) != evaluateExpression(right, context)
      )
    case '==':
      return !!(
        evaluateExpression(left, context) == evaluateExpression(right, context)
      )
    case 'gt':
    case '>':
      return (
        evaluateExpression(left, context) > evaluateExpression(right, context)
      )
    case 'gte':
    case '>=':
      return (
        evaluateExpression(left, context) >= evaluateExpression(right, context)
      )
    case 'lt':
    case '<':
      return (
        evaluateExpression(left, context) < evaluateExpression(right, context)
      )
    case 'lte':
    case '<=':
      return (
        evaluateExpression(left, context) <= evaluateExpression(right, context)
      )
    default:
      console.error('Unhandled binary expression', expression)
      return undefined
  }
}

export function evaluateBuiltInExpression(
  expression: BuiltInExpression,
  context: Context
): any {
  const { left, right, operator } = expression

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
    console.error('Unhandled built-in expression', expression)
    return undefined
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
        case 'Object':
          return Object.keys(value).length !== 0
        case 'Null':
          return false
        case 'Undefined':
          return false
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
      return regexp.test(value)
    }
    default:
      console.error('Unhandled built-in expression', name)
      return undefined
  }
}

export function evaluateExpression(
  unclassified: Expression,
  context: Context
): any {
  const { type } = unclassified

  switch (type) {
    case 'Identifier':
      return evaluateIdentifier(unclassified as Identifier, context)
    case 'Literal':
      return evaluateLiteral(unclassified as Literal, context)
    case 'UnaryExpression':
      return evaluateUnaryExpression(unclassified as UnaryExpression, context)
    case 'CallExpression':
      return evaluateCallExpression(unclassified as CallExpression, context)
    case 'BuiltInExpression':
      return evaluateBuiltInExpression(
        unclassified as BuiltInExpression,
        context
      )
    case 'BinaryExpression':
      return evaluateBinaryExpression(unclassified as BinaryExpression, context)
    case 'LogicalExpression':
      return evaluateLogicalExpression(
        unclassified as LogicalExpression,
        context
      )
    default:
      console.error('Unhandled expression', unclassified)
      return undefined
  }
}
