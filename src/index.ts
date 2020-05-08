import fs from 'fs'
import { Plugin } from '@lona/compiler/lib/plugins'
import { Helpers } from '@lona/compiler/lib/helpers'
import { describeComparison, copy } from 'buffs'

import * as Options from './options'
import { convert } from './lona/workspace'

async function parseWorkspace(
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
}

async function parseFile(
  filePath: string,
  helpers: Helpers,
  options: {
    [argName: string]: unknown
  }
): Promise<void> {
  return Promise.reject('Not implemented')
}

const plugin: Plugin = {
  format: 'android',
  parseFile,
  parseWorkspace,
}

export default plugin
