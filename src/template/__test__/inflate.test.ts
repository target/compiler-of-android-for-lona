import fs from 'fs'
import { describe as describeFs } from 'buffs'
import { inflate } from '../inflate'
import { inflateTemplate } from '../../lona/workspace'
import { templatePathForName } from '../bundled'
import { createTemplateContext, CreateTemplateContextOptions } from '../context'

const defaultTemplateOptions: CreateTemplateContextOptions = {
  packageName: 'com.example.designsystem',
  minSdk: 21,
  targetSdk: 29,
  buildSdk: 29,
}

describe('Template / Inflate', () => {
  it('inflates module template', () => {
    const { files } = inflate(
      fs,
      templatePathForName('module'),
      '/prefix',
      createTemplateContext(defaultTemplateOptions)
    )

    expect(describeFs(files, '/')).toMatchSnapshot()
    expect(
      files.readFileSync('/prefix/designsystem/build.gradle', 'utf8')
    ).toMatchSnapshot()
  })

  it('inflates project template', () => {
    const { files } = inflate(
      fs,
      templatePathForName('project'),
      '/prefix',
      createTemplateContext(defaultTemplateOptions)
    )

    expect(describeFs(files, '/')).toMatchSnapshot()
    expect(files.readFileSync('/prefix/build.gradle', 'utf8')).toMatchSnapshot()
  })

  it('inflates project template, then module template on top', () => {
    const { files } = inflateTemplate('/prefix', defaultTemplateOptions)

    expect(describeFs(files, '/')).toMatchSnapshot()
    expect(files.readFileSync('/prefix/settings.gradle', 'utf8')).toEqual(
      "include ':designsystem'\n"
    )
  })
})
