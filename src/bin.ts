#!/usr/bin/env node

import fs from 'fs'
import * as SVG from './svg/convert'
import { createFile } from './android/vectorDrawable'
import { inflateFile } from './freemarker'

import plugin from './index'
import { createTemplateContext } from './template/context'

const [, , command, inputPath, outputPath] = process.argv

const usage = `This script exposes utilities useful for developing the Lona Android plugin.

Available commands:

convert    workspace_path [target_path]   Convert a Lona workspace to an Android project
svg2vector source_file [target_path]      Output a VectorDrawable to stdout or the target_path
freemarker source_file [target_path]      Output a FreeMarker template to stdout or the target_path
`

async function main() {
  switch (command) {
    case 'convert':
      return convert()
    case 'freemarker':
      return freemarker()
    case 'svg2vector':
      return svg2vector()
    default:
      if (command !== 'help') {
        console.log(
          command ? `Unsupported command: ${command}\n` : 'No command passed\n'
        )
      }
      console.log(usage)
  }
}

main()

// Commands

async function writeSingleFileOutput(
  outputPath: string | undefined,
  data: string
) {
  if (outputPath) {
    await fs.promises.writeFile(outputPath, data)
  } else {
    console.log(data)
  }
}

async function convert() {
  if (!inputPath) {
    console.log('No source_file given')
    process.exit(1)
  }

  const helpers = await createHelpers(inputPath)

  const formatConfig = (helpers.config.format || {}) as { android?: any }
  const pluginConfig = formatConfig.android || {}

  await plugin.parseWorkspace(inputPath, helpers, {
    ...pluginConfig,
    ...(outputPath && { output: outputPath }),
  })
}

async function svg2vector() {
  if (!inputPath) {
    console.log('No source_file given')
    process.exit(1)
  }

  const svgString = await fs.promises.readFile(inputPath, 'utf8')
  const svg = await SVG.parse(svgString)
  const vectorDrawable = SVG.convert(svg)
  const xmlString = createFile(vectorDrawable)

  writeSingleFileOutput(outputPath, xmlString)

  if (svg.metadata.unsupportedFeatures.length > 0) {
    console.error()
    console.error(
      `Failed to convert SVG to VectorDrawable losslessly due to unsupported features: ${svg.metadata.unsupportedFeatures.join(
        ', '
      )}`
    )
  }
}

async function freemarker() {
  if (!inputPath) {
    console.log('No source_file given')
    process.exit(1)
  }

  const result = inflateFile(
    fs,
    inputPath,
    createTemplateContext({
      packageName: 'test',
      minSdk: 21,
      targetSdk: 29,
      buildSdk: 29,
    })
  )

  writeSingleFileOutput(outputPath, result)
}

function createHelpers(workspacePath: string) {
  try {
    const helpers = require('@lona/compiler/lib/helpers').default
    return helpers(workspacePath)
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n@lona/compiler must be installed to run this command\n')
      process.exit(1)
    } else {
      throw error
    }
  }
}
