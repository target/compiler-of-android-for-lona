import path from 'path'
import { describe as describeFs } from 'buffs'
import { convert } from '../lona/workspace'
import createHelpers from '@lona/compiler/lib/helpers'
import { DEFAULT_NAME_TEMPLATE } from '../android/valueResources'

describe('Convert', () => {
  it('converts the example workspace', async () => {
    const workspacePath = path.join(__dirname, '../../example')
    const outputPath = '/build'

    const helpers = await createHelpers(workspacePath)
    const result = await convert(workspacePath, helpers, {
      verbose: false,
      outputPath,
      packageName: 'com.test.designlibrary',
      minSdk: 21,
      buildSdk: 29,
      targetSdk: 29,
      generateGallery: false,
      valueResourceNameTemplate: DEFAULT_NAME_TEMPLATE,
    })

    expect(describeFs(result, outputPath)).toMatchSnapshot()
  })
})
