import * as XML from '../../xml/ast'
import { convert } from '../color'

describe('Tokens / Color', () => {
  test('converts a hex color', () => {
    const color = convert({
      qualifiedName: ['my', 'test'],
      value: {
        css: '#FF0000',
      },
    })

    const mock: XML.Element = {
      tag: 'color',
      attributes: [{ name: 'name', value: 'my_test' }],
      content: [{ type: 'charData', data: '#FF0000' }],
    }

    expect(color).toEqual(mock)
  })
})
