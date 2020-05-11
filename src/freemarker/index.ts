import util from 'util'
import { IFS } from 'buffs'
import { Context } from './context'
import { parse } from './parse'
import { evaluate } from './evaluate'

export * from './parse'
export * from './evaluate'
export * from './context'

export function inflate(templateString: string, context: Context): string {
  const template = parse(templateString)

  if (template.ast.errors) {
    console.error('ERROR: Failed to parse template')
    console.error(
      templateString.slice(0, 100) + (templateString.length > 100 ? '...' : '')
    )
    console.error(util.inspect(template.ast.errors, false, null, true))
  }

  return evaluate(template.ast, context)
}

export function inflateFile(
  source: IFS,
  filePath: string,
  context: Context
): string {
  const data = source.readFileSync(filePath, 'utf8')
  const template = parse(data)

  if (template.ast.errors) {
    console.error('ERROR: Failed to parse', filePath)
    console.error(util.inspect(template.ast.errors, false, null, true))
  }

  return evaluate(template.ast, context)
}
