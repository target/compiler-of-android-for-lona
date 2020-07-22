import { parse } from '../parse'

describe('Freemarker / Parse', () => {
  it('parses a template', () => {
    const template = '<#if x>yes</#if>'

    expect(parse(template).ast).toMatchSnapshot()
  })
})
