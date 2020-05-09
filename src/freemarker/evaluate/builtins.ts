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
 * Reference
 * https://freemarker.apache.org/docs/ref_builtins_string.html#ref_builtin_remove_beginning
 */
export function removeBeginning(instance: any, args: any[]) {
  const prefix: string = args[0]
  const string: string = instance
  return prefix.length > 0 && string.startsWith(prefix)
    ? string.slice(prefix.length)
    : string
}

/**
 * Reference
 * https://freemarker.apache.org/docs/ref_builtins_string.html#ref_builtin_remove_ending
 */
export function removeEnding(instance: any, args: any[]) {
  const suffix: string = args[0]
  const string: string = instance
  return suffix.length > 0 && string.endsWith(suffix)
    ? string.slice(0, -suffix.length)
    : string
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

/**
 * Reference:
 * https://freemarker.apache.org/docs/ref_builtins_sequence.html#ref_builtin_join
 */
export function join(instance: any, args: any[]) {
  const [separator, emptyValue = '', listEnding = ''] = args

  const list = Array.isArray(instance) ? instance.filter(x => x != null) : []

  return list.length === 0 ? emptyValue : list.join(separator) + listEnding
}

/**
 * Note: currently the "r" flag is ignored
 *
 * Reference:
 * https://freemarker.apache.org/docs/ref_builtins_string.html#ref_builtin_split
 */
export function split(instance: any, args: any[]) {
  const [separator, flags] = args

  return instance.split(separator)
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
    case 'removeBeginning':
      return removeBeginning(instance, args)
    case 'removeEnding':
      return removeEnding(instance, args)
    case 'matches':
      return matches(instance, args)
    case 'join':
      return join(instance, args)
    case 'split':
      return split(instance, args)
    default:
      console.error('Unhandled built-in method:', methodName)
      return undefined
  }
}
