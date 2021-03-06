import * as Options from '../options'
import { DEFAULT_VALUE_NAME_TEMPLATE } from '../android/valueResources'
import { DEFAULT_DRAWABLE_NAME_TEMPLATE } from '../android/drawableResources'

const defaultRawOptions: Options.Raw = {
  packageName: 'com.example.test',
  minSdk: 21,
}

describe('Options', () => {
  test('accepts valid options', async () => {
    const raw: Options.Raw = defaultRawOptions

    const validated: Options.Validated = {
      verbose: false,
      shouldOutputFiles: false,
      dryRun: false,
      outputPath: 'cwd',
      packageName: 'com.example.test',
      minSdk: 21,
      buildSdk: 29,
      targetSdk: 29,
      generateGallery: false,
      valueResourceNameTemplate: DEFAULT_VALUE_NAME_TEMPLATE,
      drawableResourceNameTemplate: DEFAULT_DRAWABLE_NAME_TEMPLATE,
      noOverwrite: [],
    }

    expect(Options.validate(raw, 'cwd')).toEqual({
      type: 'ok',
      value: validated,
    })
  })

  test('only outputs files if --output is passed and --dry-run is not', async () => {
    const hasOutput: Options.Raw = {
      ...defaultRawOptions,
      output: './example',
    }

    const hasOutputAndDryRun: Options.Raw = {
      ...defaultRawOptions,
      output: './example',
      dryRun: true,
    }

    const noOutput: Options.Raw = defaultRawOptions

    expect(Options.validate(hasOutput, 'cwd')).toMatchObject({
      value: {
        shouldOutputFiles: true,
      },
    })

    expect(Options.validate(hasOutputAndDryRun, 'cwd')).toMatchObject({
      value: {
        shouldOutputFiles: false,
      },
    })

    expect(Options.validate(noOutput, 'cwd')).toMatchObject({
      value: {
        shouldOutputFiles: false,
      },
    })
  })

  test('rejects invalid options', async () => {
    const raw: Options.Raw = {}

    expect(Options.validate(raw, 'cwd').type).toEqual('error')
  })
})
