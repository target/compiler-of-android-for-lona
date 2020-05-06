import { parse, evaluate, ProgramNode } from '../index'
import { createContext } from '../context'

describe('Freemarker', () => {
  it('parses a template', () => {
    const template = '<#if x>yes</#if>'

    expect(parse(template).ast).toMatchSnapshot()
  })

  it('evaluates a template', () => {
    const template = '<#if x>yes</#if>'
    const ast = parse(template).ast as ProgramNode

    expect(evaluate(ast, createContext({ x: true }))).toEqual('yes')
    expect(evaluate(ast, createContext({ x: false }))).toEqual('')
  })
})
