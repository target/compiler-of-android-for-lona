import { Parser, CompiledRules, Grammar } from 'nearley'

const { evaluate } = require('web-module-loader')

const compile = require('nearley/lib/compile')
const generate = require('nearley/lib/generate')
const nearleyGrammar: Grammar = require('nearley/lib/nearley-language-bootstrapped')

// https://nearley.js.org/docs/using-in-frontend
export function compileGrammar(
  sourceCode: string,
  modules: { [key: string]: any } = {}
): CompiledRules {
  // Parse the grammar source into an AST
  const grammarParser = new Parser(nearleyGrammar)
  grammarParser.feed(sourceCode)

  const grammarAst = grammarParser.results[0] // TODO check for errors

  // Compile the AST into a set of rules
  const grammarInfoObject = compile(grammarAst, {})
  // Generate JavaScript code from the rules
  const grammarJs = generate(grammarInfoObject, 'grammar')

  // Pretend this is a CommonJS environment to catch exports from the grammar.
  const result = evaluate((name: string) =>
    name in modules ? modules[name] : {}
  )(grammarJs)

  return result as CompiledRules
}

export function makeParser(
  compiledRules: CompiledRules,
  start?: string
): Parser {
  const grammar = Grammar.fromCompiled(compiledRules)

  if (start) {
    grammar.start = start
  }

  return new Parser(grammar)
}
