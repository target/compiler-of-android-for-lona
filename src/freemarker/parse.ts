import { Parser } from 'freemarker-parser/src'
import { ParserReturn } from 'freemarker-parser/src/Parser'

export function parse(templateString: string): ParserReturn {
  const parser = new Parser()
  const data = parser.parse(templateString)
  return data
}
