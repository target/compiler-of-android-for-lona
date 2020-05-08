import {
  cssToHexColor,
  formatQualifiedName,
  DEFAULT_NAME_TEMPLATE,
} from '../valueResources'

describe('Android / Resources', () => {
  test('creates a hex color with alpha', () => {
    expect(cssToHexColor('rgba(0,127,255,0.5)')).toBe('#007FFF80')
  })

  test('creates a hex color without alpha', () => {
    expect(cssToHexColor('teal')).toBe('#008080')
  })

  test('formats token names', () => {
    expect(
      formatQualifiedName(['a', 'b', 'c'], {
        nameTemplate: DEFAULT_NAME_TEMPLATE,
      })
    ).toEqual('a_b_c')

    expect(
      formatQualifiedName(['a', 'b', 'c'], {
        nameTemplate: 'prefix_' + DEFAULT_NAME_TEMPLATE,
      })
    ).toEqual('prefix_a_b_c')
  })
})
