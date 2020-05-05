import fs from 'fs'
import { describe as describeFs } from 'buffs'
import { inflate } from '../inflate'
import { templatePathForName } from '../builtins'

describe('Template / Inflate', () => {
  it('inflates module template', async () => {
    const target = await inflate(fs, templatePathForName('module'), {
      projectName: 'example',
    })

    expect(describeFs(target, '/')).toMatchSnapshot()
  })

  it('inflates project template', async () => {
    const target = await inflate(fs, templatePathForName('project'), {
      projectName: 'example',
    })

    expect(describeFs(target, '/')).toMatchSnapshot()
  })
})
