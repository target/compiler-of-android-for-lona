import { createNamespace } from '../namespace'
import * as Serialization from '@lona/serialization'

describe('Logic / Namespace', () => {
  it('adds records to the namespace', () => {
    const file = `
struct Color {
  let value: String = ""
}
`
    let logic = Serialization.decodeLogic(file)

    let namespace = createNamespace(logic)

    expect(Object.keys(namespace.types)).toEqual(['Color'])
    expect(Object.keys(namespace.values)).toEqual(['Color.value'])
  })

  it('adds enums to the namespace', () => {
    const file = `
enum TextAlign {
  case left()
  case center()
  case right()
}
`
    let logic = Serialization.decodeLogic(file)

    let namespace = createNamespace(logic)

    expect(Object.keys(namespace.types)).toEqual(['TextAlign'])
    expect(Object.keys(namespace.values)).toEqual([
      'TextAlign.left',
      'TextAlign.center',
      'TextAlign.right',
    ])
  })
})
