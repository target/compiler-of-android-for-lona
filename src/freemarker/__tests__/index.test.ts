import { parse, evaluate, ProgramNode } from '../index'

describe('Freemarker', () => {
  it('parses a template', () => {
    const template = '<#if x>yes</#if>'

    expect(parse(template).ast).toMatchSnapshot()
  })

  it('evaluates a template', () => {
    const template = '<#if x>yes</#if>'
    const ast = parse(template).ast as ProgramNode

    expect(evaluate(ast, { data: { x: true } })).toEqual('yes')
    expect(evaluate(ast, { data: { x: false } })).toEqual('')
  })
})
