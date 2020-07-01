import fs from 'fs'
import { Plugin } from '@lona/compiler/lib/plugins'
import { Helpers } from '@lona/compiler/lib/helpers'
import { describeComparison, copy } from 'buffs'
import { isMatch } from 'micromatch'

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

    const {
      shouldOutputFiles,
      outputPath,
      noOverwrite,
    } = validatedOptions.value

    if (shouldOutputFiles) {
      copy(source, fs, outputPath, undefined, {
        filterPath: ({ targetPath }) => {
          // Check if this file is in the "noOverwrite" list
          const matched = noOverwrite.some(pattern =>
            isMatch(targetPath, pattern)
          )

          // If we matched this file, don't overwrite it if it already exists
          if (matched && fs.existsSync(targetPath)) {
            return false
          }

          return true
        },
      })
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
