import { Context } from '../context'

describe('Freemarker / Context', () => {
  it('gets values', () => {
    const context = new Context({ foo: 'bar' })

    expect(context.get('foo')).toEqual('bar')
    expect(context.has('foo')).toEqual(true)
    expect(context.has('hello')).toEqual(false)
  })

  it('sets values', () => {
    const context = new Context({ foo: 'bar' })

    context.set('foo', 'baz')
    context.set('hello', 'world')

    expect(context.get('foo')).toEqual('baz')
    expect(context.get('hello')).toEqual('world')
  })

  it('merges default values', () => {
    const context = new Context({ foo: 'bar' })
    const merged = context.withDefaults({
      foo: 'baz',
      hello: 'world',
    })

    expect(merged.get('foo')).toEqual('bar')
    expect(merged.get('hello')).toEqual('world')
  })
})
