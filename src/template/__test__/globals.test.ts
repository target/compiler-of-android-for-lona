import * as XML from '../../xml'
import { getGlobals } from '../globals'

describe('Template / Globals', () => {
  it('parses globals', () => {
    const globals = XML.parse(`<globals>
  <global id="str" value="test" />
  <global id="bool" type="boolean" value="true" />
</globals>`)

    expect(getGlobals(globals)).toEqual({
      str: 'test',
      bool: true,
    })
  })
})
