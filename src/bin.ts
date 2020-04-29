#!/usr/bin/env node

import fs from 'fs'
import { parse, convert } from './svg/index'
import { createFile } from './android/vectorDrawable'
import { createBuildScript, DEFAULT_BUILD_CONFIG } from './android/gradle'

const [, , command, inputPath] = process.argv

async function main() {
  switch (command) {
    case 'svg': {
      const data = fs.readFileSync(inputPath, 'utf8')
      const parsed = await parse(data)
      const converted = convert(parsed)
      const xml = createFile(converted)
      console.log(xml)
    }
  }
}

main()
