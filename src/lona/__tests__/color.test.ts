import * as XML from '../../xml/ast'
import { convert } from '../color'
import { DEFAULT_VALUE_NAME_TEMPLATE } from '../../android/valueResources'

describe('Tokens / Color', () => {
  test('converts a hex color', () => {
    const color = convert(
      {
        qualifiedName: ['my', 'test'],
        value: {
          css: '#FF0000',
        },
      },
      {
        nameTemplate: DEFAULT_VALUE_NAME_TEMPLATE,
      }
    )

    const mock: XML.Element = {
      tag: 'color',
      attributes: [{ name: 'name', value: 'my_test' }],
      content: [{ type: 'charData', data: '#FF0000' }],
    }

    expect(color).toEqual(mock)
  })
})
