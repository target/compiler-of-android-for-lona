import path from 'path'
import fs from 'fs'
import { describe as describeFs } from 'buffs'
import { createHelpers } from '@lona/compiler/lib/helpers'
import plugin from '..'
import { convert } from '../lona/workspace'
import { DEFAULT_VALUE_NAME_TEMPLATE } from '../android/valueResources'
import { DEFAULT_DRAWABLE_NAME_TEMPLATE } from '../android/drawableResources'

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

    const helpers = createHelpers(fs, workspacePath)
    const result = await convert(workspacePath, helpers, {
      verbose: false,
      outputPath,
      packageName: 'com.test.designlibrary',
      minSdk: 21,
      buildSdk: 29,
      targetSdk: 29,
      generateGallery: false,
      valueResourceNameTemplate: DEFAULT_VALUE_NAME_TEMPLATE,
      drawableResourceNameTemplate: DEFAULT_DRAWABLE_NAME_TEMPLATE,
      noOverwrite: [],
    })

    expect(describeFs(result, outputPath)).toMatchSnapshot()

    const rowComponent = result.readFileSync(
      path.join(
        outputPath,
        'designlibrary/src/main/java/com/test/designlibrary/RowView.kt'
      ),
      'utf8'
    )
    const rowLayout = result.readFileSync(
      path.join(outputPath, 'designlibrary/src/main/res/layout/row.xml'),
      'utf8'
    )

    expect(rowComponent).toMatchSnapshot()
    expect(rowLayout).toMatchSnapshot()
  })

  it('runs the plugin in dry-run mode without any errors', async () => {
    const workspacePath = path.join(__dirname, '../../example')
    const output = path.join(__dirname, '../../example')

    const helpers = await createHelpers(fs, workspacePath, {
      reporter: silentReporter,
    })

    await plugin.convertWorkspace(workspacePath, helpers, {
      ...helpers.config.format.android,
      output,
      dryRun: true,
    })
  })
})
