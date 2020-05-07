import { cssToHexColor } from '../valueResources'

describe('Android / Resources', () => {
  test('creates a hex color with alpha', () => {
    expect(cssToHexColor('rgba(0,127,255,0.5)')).toBe('#007FFF80')
  })

  test('creates a hex color without alpha', () => {
    expect(cssToHexColor('teal')).toBe('#008080')
  })
})
