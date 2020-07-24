import * as XML from '../../xml'
import { parse } from '../globals'

describe('Template / Globals', () => {
  it('parses globals', () => {
    const globals = XML.parse(`<globals>
  <global id="str" value="test" />
  <global id="bool" type="boolean" value="true" />
</globals>`)

    expect(parse(globals)).toEqual({
      str: 'test',
      bool: true,
    })
  })
})
