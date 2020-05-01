import path from 'path'
import { SVG } from '@lona/svg-model'
import { parse, convert } from './convert'
import * as VectorDrawable from '../android/vectorDrawable'
import { createFs, IFS } from 'buffs'
import { rasterize } from './rasterize'

type PixelDensity = {
  name: string
  value: number
  scale: number
}

const ALL_PIXEL_DENSITIES: PixelDensity[] = [
  { name: 'mdpi', value: 160, scale: 1 },
  { name: 'hdpi', value: 240, scale: 1.5 },
  { name: 'xhdpi', value: 320, scale: 2 },
  { name: 'xxhdpi', value: 480, scale: 3 },
  { name: 'xxxhdpi', value: 640, scale: 4 },
]

export const formatDrawableName = (
  relativePath: string,
  extname: string = ''
): string => {
  const fileName = relativePath.replace(/[\/\-]/g, '_').toLowerCase()
  return path.basename(fileName, '.svg') + (extname ? `.${extname}` : '')
}

/**
 * Strings in XML files will crash the Android build and app.
 * The limit is currently 0x7FFF, defined here:
 * https://android.googlesource.com/platform/frameworks/base.git/+/master/tools/aapt2/StringPool.cpp#340
 */
function containsReallyLongString(svg: SVG): boolean {
  for (const path of svg.children) {
    const string = VectorDrawable.pathString(path.data.params.commands)
    if (string.length > 0x7fff) {
      return true
    }
  }

  return false
}

export async function createFiles(
  relativePath: string,
  data: Buffer
): Promise<IFS> {
  const { fs } = createFs()

  const svg = await parse(data.toString('utf8'))

  if (
    svg.metadata.unsupportedFeatures.length === 0 &&
    !containsReallyLongString(svg)
  ) {
    const name = formatDrawableName(relativePath, 'xml')

    const vectorDrawable = VectorDrawable.createFile(convert(svg))
    await fs.promises.mkdir('/drawable')
    await fs.promises.writeFile(path.join('/drawable', name), vectorDrawable)
  } else {
    const name = formatDrawableName(relativePath, 'png')

    await Promise.all(
      ALL_PIXEL_DENSITIES.map(async density => {
        const viewBox = svg.params.viewBox
        const png = await rasterize(data, {
          width: (viewBox?.width ?? 0) * density.scale,
          height: (viewBox?.height ?? 0) * density.scale,
        })
        const directoryName = `/drawable-${density.name}`
        await fs.promises.mkdir(directoryName)
        await fs.promises.writeFile(path.join(directoryName, name), png)
      })
    )
  }

  return fs
}
