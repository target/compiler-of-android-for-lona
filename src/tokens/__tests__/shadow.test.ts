import * as XML from '../../xml/ast'
import { convert } from '../shadow'

describe('Tokens / Shadow', () => {
  test('converts a shadow', () => {
    const shadow = convert({
      qualifiedName: ['my', 'test'],
      value: {
        x: 0,
        y: 2,
        blur: 0,
        radius: 0,
        color: {
          css: 'rgba(0,0,0,0.1)',
        },
      },
    })

    const mock: XML.Element = {
      tag: 'dimen',
      attributes: [{ name: 'name', value: 'my_test' }],
      content: [{ type: 'charData', data: '2dp' }],
    }

    expect(shadow).toEqual(mock)
  })
})
