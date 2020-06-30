import { print } from '@lona/compiler/lib/utils/printer'
import * as AST from './ast'
import { formatProgram } from './format'

const printerOptions = { printWidth: 100, tabWidth: 4, useTabs: false }

export default function printGroovy(program: AST.Program) {
  return print(formatProgram(program), printerOptions)
}
