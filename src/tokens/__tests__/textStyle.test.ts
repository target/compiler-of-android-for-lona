import * as XML from '../../xml/ast'
import { convert } from '../textStyle'

describe('Tokens / Text Style', () => {
  test('converts a text style', () => {
    const textStyle = convert({
      qualifiedName: ['my', 'test'],
      value: {
        fontFamily: 'Helvetica',
        fontSize: 24,
        fontWeight: '400',
      },
    })

    const mock: XML.Element = {
      tag: 'style',
      attributes: [{ name: 'name', value: 'my_test' }],
      content: [
        {
          type: 'element',
          data: {
            tag: 'item',
            attributes: [{ name: 'name', value: 'android:fontFamily' }],
            content: [{ type: 'charData', data: 'Helvetica' }],
          },
        },
        {
          type: 'element',
          data: {
            tag: 'item',
            attributes: [{ name: 'name', value: 'android:textSize' }],
            content: [{ type: 'charData', data: '24sp' }],
          },
        },
        {
          type: 'element',
          data: {
            tag: 'item',
            attributes: [{ name: 'name', value: 'android:fontWeight' }],
            content: [{ type: 'charData', data: '400' }],
          },
        },
      ],
    }

    expect(textStyle).toEqual(mock)
  })
})
