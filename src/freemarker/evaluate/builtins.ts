import escapeRegExp from 'lodash.escaperegexp'

function typeName(value: any): string {
  return {}.toString.call(value).slice(8, -1)
}

/**
 * Reference:
 * https://freemarker.apache.org/docs/ref_builtins_expert.html#ref_builtin_has_content
 */
export function hasContent(instance: any, args: any[]) {
  switch (typeName(instance)) {
    case 'String':
      return instance !== ''
    case 'Boolean':
      return instance !== false
    case 'Number':
      return instance !== 0
    case 'Array':
      return instance.length !== 0
    case 'Object':
      return Object.keys(instance).length !== 0
    case 'Null':
      return false
    case 'Undefined':
      return false
    default:
      return !!typeName
  }
}

/**
 * Reference:
 * https://freemarker.apache.org/docs/ref_builtins_string.html#ref_builtin_replace
 *
 * For flags, see:
 * https://freemarker.apache.org/docs/ref_builtins_string.html#ref_builtin_string_flags
 */
export function replace(instance: any, args: any[]) {
  const [original, replacement, flags] = args

  const firstOnly = flags.includes('f')
  const regExpFlags = firstOnly ? flags.replace('f', '') : flags + 'g'

  const result = instance.replace(
    new RegExp(escapeRegExp(original), regExpFlags),
    replacement
  )

  return result
}

/**
 * Reference (multiple definitions):
 * https://freemarker.apache.org/docs/ref_builtins_alphaidx.html
 */
export function string(instance: any, args: any[]) {
  return instance.toString()
}

/**
 * Reference:
 * https://freemarker.apache.org/docs/ref_builtins_string.html#ref_builtin_matches
 */
export function matches(instance: any, args: any[]) {
  const escaped = '"' + args[0].replace(/"/g, '\\"') + '"'
  const regexp = new RegExp(JSON.parse(escaped))
  return regexp.test(instance)
}

export function evaluateBuiltInMethod(
  methodName: string,
  instance: any,
  args: any[]
): any {
  switch (methodName) {
    case 'replace':
      return replace(instance, args)
    case 'has_content':
      return hasContent(instance, args)
    case 'string':
      return string(instance, args)
    case 'matches':
      return matches(instance, args)
    default:
      console.error('Unhandled built-in method:', methodName)
      return undefined
  }
}
