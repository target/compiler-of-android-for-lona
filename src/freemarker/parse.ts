import { Parser } from 'freemarker-parser/dist'
import { ParserReturn } from 'freemarker-parser/dist/Parser'

export function parse(templateString: string): ParserReturn {
  const parser = new Parser()
  const data = parser.parse(templateString)
  return data
}
