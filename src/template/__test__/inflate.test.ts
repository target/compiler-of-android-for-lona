import fs from 'fs'
import { Union } from 'unionfs'
import { describe as describeFs, copy, createFs } from 'buffs'
import { inflate } from '../inflate'
import { inflateTemplate } from '../../lona/workspace'
import { templatePathForName } from '../builtins'

describe('Template / Inflate', () => {
  it('inflates module template', () => {
    const target = inflate(fs, templatePathForName('module'), '/prefix', {
      packageName: 'com.example.designsystem',
    })

    expect(describeFs(target, '/')).toMatchSnapshot()
  })

  it('inflates project template', () => {
    const target = inflate(fs, templatePathForName('project'), '/prefix', {
      packageName: 'com.example.designsystem',
    })

    expect(describeFs(target, '/')).toMatchSnapshot()
  })

  it('inflates project template, then module template on top', () => {
    const { files } = inflateTemplate(
      'project',
      'com.example.designsystem',
      '/prefix'
    )

    expect(describeFs(files, '/')).toMatchSnapshot()
    expect(files.readFileSync('/prefix/settings.gradle', 'utf8')).toEqual(
      "include ':designsystem'\n"
    )
  })
})
