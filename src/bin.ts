#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import util from 'util'
import * as Xml from './xml/parse'
import { parse, convert } from './svg/convert'
import { createFile } from './android/vectorDrawable'
import { getConfig } from './template/config'
import * as FreeMarker from './freemarker'
import { inflate } from './template/inflate'
import { describe, copy } from 'buffs'

const [, , command, inputPath, outputPath] = process.argv

async function main() {
  switch (command) {
    case 'template': {
      // if (!inputPath) {
      //   console.log('No filename given')
      //   process.exit(1)
      // }

      // const result = await inflate('example', inputPath)

      // console.log(describe(result, '/'))

      // if (outputPath) {
      //   copy(result, fs, '/', outputPath)
      // }

      break
    }
    case 'freemarker': {
      if (!inputPath) {
        console.log('No filename given')
        process.exit(1)
      }

      const data = await fs.promises.readFile(inputPath, 'utf8')
      console.log('--------- TEMPLATE ---------')
      console.log(data)

      const parsed = FreeMarker.parse(data)
      const result = FreeMarker.evaluate(parsed.ast, {
        data: {
          makeIgnore: true,
          sdkDir: true,
          topOut: '/example',
          escapeXmlAttribute: (value: string) => value,
        },
      })

      const inspected = util.inspect(parsed.ast, false, null, true)

      console.log('--------- AST ----------')
      console.log(inspected)

      console.log('--------- RESULT ----------')
      console.log(result)
      break
    }
    case 'template-config': {
      if (!inputPath) {
        console.log('No filename given')
        process.exit(1)
      }

      const data = await fs.promises.readFile(inputPath, 'utf8')

      const parsed = Xml.parse(data)

      const config = getConfig(parsed)

      // const inspected = util.inspect(parsed, false, null, true)
      // console.log(inspected)

      const inspected = util.inspect(config, false, null, true)
      console.log(inspected)
      break
    }
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
      break
    }
    default:
      console.log('no command passed')
  }
}

main()
