import fs from 'fs'
import { Plugin } from '@lona/compiler/lib/plugins'
import { Helpers } from '@lona/compiler/lib/helpers'
import { describeComparison, copy } from 'buffs'

import * as Options from './options'
import { convert } from './lona/workspace'

const plugin: Plugin<Options.Raw, void> = {
  format: 'android',

  async convertWorkspace(
    workspacePath: string,
    helpers: Helpers,
    rawOptions: Options.Raw
  ): Promise<void> {
    const validatedOptions = Options.validate(rawOptions, process.cwd())

    if (validatedOptions.type === 'error') {
      return Promise.reject(validatedOptions.value)
    }

    const source = await convert(workspacePath, helpers, validatedOptions.value)

    const { shouldOutputFiles, outputPath } = validatedOptions.value

    if (shouldOutputFiles) {
      copy(source, fs, outputPath)
    } else {
      helpers.reporter.info(
        `\nThe following files will be generated at ${outputPath}:\n`
      )

      const description = describeComparison(source, fs, outputPath, {
        colorize: true,
      })

      helpers.reporter.info(description)

      if (!outputPath) {
        helpers.reporter.info(
          '\nUse the --ouput [path] option to specify the output directory.\n'
        )
      }
    }
  },
}

export default plugin
