import { createNamespace } from '../namespace'
import * as Serialization from '@lona/serialization'
import fs from 'fs'
import path from 'path'

function readLibrary(name: string): string {
  const librariesPath = path.join(__dirname, '../library')
  return fs.readFileSync(path.join(librariesPath, `${name}.logic`), 'utf8')
}

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

  it('loads Color.logic', () => {
    let logic = Serialization.decodeLogic(readLibrary('Color'))

    let namespace = createNamespace(logic)

    expect(Object.keys(namespace.types)).toEqual(['Color'])
    expect(Object.keys(namespace.values)).toEqual([
      'Color.value',
      'Color.setHue',
      'Color.setSaturation',
      'Color.setLightness',
      'Color.fromHSL',
      'Color.saturate',
    ])
  })

  it('loads TextStyle.logic', () => {
    let logic = Serialization.decodeLogic(readLibrary('TextStyle'))

    let namespace = createNamespace(logic)

    expect(Object.keys(namespace.types)).toEqual(['FontWeight', 'TextStyle'])
    expect(Object.keys(namespace.values)).toEqual([
      'FontWeight.ultraLight',
      'FontWeight.thin',
      'FontWeight.light',
      'FontWeight.regular',
      'FontWeight.medium',
      'FontWeight.semibold',
      'FontWeight.bold',
      'FontWeight.heavy',
      'FontWeight.black',
      'FontWeight.w100',
      'FontWeight.w200',
      'FontWeight.w300',
      'FontWeight.w400',
      'FontWeight.w500',
      'FontWeight.w600',
      'FontWeight.w700',
      'FontWeight.w800',
      'FontWeight.w900',
      'TextStyle.fontName',
      'TextStyle.fontFamily',
      'TextStyle.fontWeight',
      'TextStyle.fontSize',
      'TextStyle.lineHeight',
      'TextStyle.letterSpacing',
      'TextStyle.color',
      'TextStyle',
    ])
  })
})
