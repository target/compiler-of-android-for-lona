import moo from 'moo'
import { compileGrammar, makeParser } from '../utils/language'
import { Program } from './ast'
import { inspect } from 'util'

let lexer = moo.compile({
  newline: { match: /[\n]+/, lineBreaks: true },
  leftBrace: '{',
  rightBrace: '}',
  space: / +/,
  content: { match: /[^{}\n]+/, value: value => value.trim() },
})

let grammar = compileGrammar(
  `
@{%
const lexer = require('lexer')

const compact = (list) => list.filter(x => !!x)

const flattenRightRecursion = ([head, _, tail]) => [head, ...tail]
%}

@lexer lexer

main -> _ contentList _ {% 
  ([_1, items, _2]) => ({ type: 'program', content: items }) 
%}

item -> 
  block {% ([item]) => item %}
| content {% ([item]) => item %}

block -> content "{" _ contentList:? _ "}" {% 
  ([name, _1, _2, content, _3]) => ({
    type: 'block',
    name: name.value, 
    content: compact(content || []) 
  }) 
%}

content -> %content {% 
  ([item]) => ({ 
    type: 'content', 
    value: item.value 
  })
%}

contentList -> 
  item 
| item _ contentList {% flattenRightRecursion %}

_ -> (%newline | %space):* {% () => null %}
`,
  { lexer }
)

export function tokenize(source: string): moo.Token[] {
  lexer.reset(source)
  return Array.from(lexer)
}

export function parse(source: string): Program | undefined {
  const parser = makeParser(grammar)
  const results = parser.feed(source).results

  // if (results.length > 1) {
  //   console.warn('Ambiguous build script grammar')

  //   console.log(inspect(results, false, null, true))
  // }

  return results[0]
}
