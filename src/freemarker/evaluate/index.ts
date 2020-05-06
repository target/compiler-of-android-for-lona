import ProgramNode from 'freemarker-parser/dist/nodes/ProgramNode'
import { Context } from '../context'
import { evaluateNodes } from './node'

export function evaluate(program: ProgramNode, context: Context): string {
  return evaluateNodes(program.body || [], context)
}

export { ProgramNode }
