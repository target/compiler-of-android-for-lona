import path from 'path'
import { describe as describeFs } from 'buffs'
import { convert } from '../lona/workspace'
import createHelpers from '@lona/compiler/lib/helpers'

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
    })

    expect(describeFs(result, outputPath)).toMatchSnapshot()
  })
})
