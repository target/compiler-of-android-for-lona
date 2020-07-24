import { tokenize, parse } from '../parse'
import print from '../print'
import { inspect } from 'util'

const getTypes = (items: { type?: string }[]): string[] =>
  items.map(item => item.type || '')

describe('Groovy / Parse', () => {
  it('tokenizes', () => {
    const source = `dependencies {
  foo "bar"
}
`

    const tokens = tokenize(source)

    expect(getTypes(tokens)).toEqual([
      'content',
      'leftBrace',
      'newline',
      'space',
      'content',
      'newline',
      'rightBrace',
      'newline',
    ])
  })

  it('parses', () => {
    const source = `dependencies`

    const results = parse(source)

    // console.log(inspect(results[0], false, null, true))

    expect(results).toBeDefined()
  })

  it('parses', () => {
    const source = `dependencies {
  foo "bar"
}`

    const results = parse(source)

    // console.log(inspect(results, false, null, true))

    expect(results).toBeDefined()
  })

  it('parses', () => {
    const source = `dependencies {
  
      foo "bar"
  
  
      baz "baq"

}`

    const results = parse(source)

    // console.log(inspect(results, false, null, true))

    expect(results).toBeDefined()

    if (results) {
      expect(print(results)).toEqual(`dependencies {
    foo "bar"
    baz "baq"
}`)
    }
  })

  it('parses', () => {
    const source = `dependencies {
  foo "bar"

  nested {
    x 1
  }
}`

    const results = parse(source)

    // console.log(inspect(results, false, null, true))

    expect(results).toBeDefined()

    if (results) {
      expect(print(results)).toEqual(`dependencies {
    foo "bar"

    nested {
        x 1
    }
}`)
    }
  })

  it('parses multiple top level blocks', () => {
    const source = `dependencies {
  foo "bar"
}

android {
  x 1
}`

    const results = parse(source)

    // console.log(inspect(results, false, null, true))

    expect(results).toBeDefined()
  })
})
