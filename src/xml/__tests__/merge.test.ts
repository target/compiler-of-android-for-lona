import * as XML from '../ast'
import { mergeAttributes, MERGE_ATTRIBUTES_CHOOSE_SOURCE } from '../merge'

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
})
