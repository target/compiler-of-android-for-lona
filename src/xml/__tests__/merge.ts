import * as XML from '../ast'
import {
  mergeAttributes,
  MERGE_ATTRIBUTES_CHOOSE_SOURCE,
  mergeContentByUniqueAttribute,
} from '../merge'

describe('XML / Merge', () => {
  test('merges attributes', () => {
    const source: XML.Attribute[] = [
      { name: 'a', value: 'a1' },
      { name: 'b', value: 'b1' },
    ]
    const target: XML.Attribute[] = [
      { name: 'a', value: 'a2' },
      { name: 'c', value: 'c2' },
    ]
    const result: XML.Attribute[] = [
      { name: 'a', value: 'a1' },
      { name: 'b', value: 'b1' },
      { name: 'c', value: 'c2' },
    ]

    expect(
      mergeAttributes(source, target, MERGE_ATTRIBUTES_CHOOSE_SOURCE)
    ).toEqual(result)
  })

  test('merges content by unique attribute', () => {
    const source: XML.Content[] = [
      {
        type: 'element',
        data: {
          tag: 'color',
          attributes: [{ name: 'name', value: 'primary' }],
          content: [
            {
              type: 'charData',
              data: '#000',
            },
          ],
        },
      },
    ]

    const target: XML.Content[] = [
      {
        type: 'element',
        data: {
          tag: 'color',
          attributes: [{ name: 'name', value: 'primary' }],
          content: [
            {
              type: 'charData',
              data: '#FFF',
            },
          ],
        },
      },
    ]

    expect(
      mergeContentByUniqueAttribute([...source, ...target], 'name')
    ).toEqual(source)
  })
})
