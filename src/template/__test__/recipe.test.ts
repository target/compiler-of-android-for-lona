import * as XML from '../../xml'
import { parse, Recipe } from '../recipe'

describe('Template / Recipe', () => {
  it('parses recipes', () => {
    const recipe = XML.parse(`<recipe>
    <instantiate
      from="from"
      to="to" />
    <copy
      from="from"
      to="to" />
    <merge
      from="from"
      to="to" />
    <dependency
      mavenUrl="mavenUrl" />
    <dependency
      name="android-support-v4"
      revision="8" />
    <mkdir
      at="at" />
  </recipe>`)

    const expected: Recipe = [
      {
        type: 'instantiate',
        value: { from: 'from', to: 'to' },
      },
      {
        type: 'copy',
        value: { from: 'from', to: 'to' },
      },
      {
        type: 'merge',
        value: { from: 'from', to: 'to' },
      },
      {
        type: 'dependency',
        value: { url: 'mavenUrl' },
      },
      {
        type: 'dependency',
        value: { url: 'com.android.support:support-v4' },
      },
      {
        type: 'mkdir',
        value: { at: 'at' },
      },
    ]

    expect(parse(recipe)).toEqual(expected)
  })
})
