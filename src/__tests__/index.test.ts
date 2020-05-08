import path from 'path'
import { describe as describeFs } from 'buffs'
import createHelpers from '@lona/compiler/lib/helpers'
import plugin from '..'
import { convert } from '../lona/workspace'
import { DEFAULT_NAME_TEMPLATE } from '../android/valueResources'

const silentReporter = {
  log: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}

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

  it('runs the plugin in dry-run mode without any errors', async () => {
    const workspacePath = path.join(__dirname, '../../example')
    const output = path.join(__dirname, '../../example')

    const helpers = await createHelpers(
      workspacePath,
      undefined,
      silentReporter
    )

    await plugin.parseWorkspace(workspacePath, helpers, {
      ...helpers.config.format.android,
      output,
      dryRun: true,
    })
  })
})
