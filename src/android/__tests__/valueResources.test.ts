import {
  cssToHexColor,
  formatQualifiedName,
  DEFAULT_VALUE_NAME_TEMPLATE,
  mergeValueResourceFiles,
} from '../valueResources'

describe('Android / ValueResources', () => {
  test('creates a hex color with alpha', () => {
    expect(cssToHexColor('rgba(0,127,255,0.5)')).toBe('#007FFF80')
  })

  test('creates a hex color without alpha', () => {
    expect(cssToHexColor('teal')).toBe('#008080')
  })

  test('formats token names', () => {
    expect(
      formatQualifiedName(['a', 'b', 'c'], {
        nameTemplate: DEFAULT_VALUE_NAME_TEMPLATE,
      })
    ).toEqual('a_b_c')

    expect(
      formatQualifiedName(['a', 'b', 'c'], {
        nameTemplate: 'prefix_' + DEFAULT_VALUE_NAME_TEMPLATE,
      })
    ).toEqual('prefix_a_b_c')
  })

  test('merges value resources', () => {
    const source = `
<resources>
  <color name="primary">#000</color>
  <string name="title">foo</string>
</resources>
`
    const target = `
<resources>
  <color name="primary">#FFF</color>
  <string name="subtitle">bar</string>
</resources>
`

    const result = `<resources>
  <color name="primary">#000</color>
  <string name="title">foo</string>
  <string name="subtitle">bar</string>
</resources>`

    expect(mergeValueResourceFiles(source, target)).toEqual(result)
  })
})
