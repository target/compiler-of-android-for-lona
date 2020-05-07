import { IFS } from 'buffs'
import { Context } from './context'
import { parse } from './parse'
import { evaluate } from './evaluate'

export * from './parse'
export * from './evaluate'
export * from './context'

export function inflateFile(
  source: IFS,
  filePath: string,
  context: Context
): string {
  const data = source.readFileSync(filePath, 'utf8')
  const template = parse(data)

  if (template.ast.errors) {
    console.log('ERROR: Failed to parse', filePath)
  }

  return evaluate(template.ast, context)
}
