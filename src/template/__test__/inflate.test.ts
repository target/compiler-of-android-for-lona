import fs from 'fs'
import { describe as describeFs } from 'buffs'
import { inflate } from '../inflate'
import { inflateProjectTemplate } from '../../lona/workspace'
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
    const { files } = inflateProjectTemplate(
      '/prefix',
      false,
      defaultTemplateOptions
    )

    expect(describeFs(files, '/')).toMatchSnapshot()
    expect(files.readFileSync('/prefix/settings.gradle', 'utf8')).toEqual(
      "include ':designsystem'\n"
    )
  })

  it('inflates project template, then module template, then gallery template', () => {
    const { files } = inflateProjectTemplate(
      '/prefix',
      true,
      defaultTemplateOptions
    )

    const mergedStrings = `<resources>
  <string name="app_name">designsystem</string>
  <string name="title_empty_activity">Empty Activity</string>
  <string name="hello_world">Hello world!</string>
</resources>`

    expect(describeFs(files, '/')).toMatchSnapshot()
    expect(
      files.readFileSync(
        '/prefix/designsystem/src/main/res/values/strings.xml',
        'utf8'
      )
    ).toEqual(mergedStrings)
  })
})
