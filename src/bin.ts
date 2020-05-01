#!/usr/bin/env node

import fs from 'fs'
import { parse, convert } from './svg/convert'
import { createFile } from './android/vectorDrawable'

const [, , command, inputPath] = process.argv

async function main() {
  switch (command) {
    case 'svg2vector': {
      if (!inputPath) {
        console.log('No svg2vector filename given')

        process.exit(1)
      }

      const data = await fs.promises.readFile(inputPath, 'utf8')
      const svg = await parse(data)
      const converted = convert(svg)
      const xml = createFile(converted)

      console.log(xml)

      if (svg.metadata.unsupportedFeatures.length > 0) {
        console.error()
        console.error(
          `Failed to convert SVG to VectorDrawable losslessly due to unsupported features: ${svg.metadata.unsupportedFeatures.join(
            ', '
          )}`
        )
      }
    }
  }
}

main()
