import path from 'path'
import { SVG } from '@lona/svg-model'
import { parse, convert } from './convert'
import * as VectorDrawable from '../android/vectorDrawable'
import { createFs, IFS } from 'buffs'
import { rasterize } from './rasterize'
import { ALL_PIXEL_DENSITIES } from '../android/pixelDensity'

/**
 * Flatten a file path into a single snake_case filename
 */
export const formatDrawableName = (
  relativePath: string,
  extname: string = ''
): string => {
  const fileName = relativePath.replace(/[\/\-]/g, '_').toLowerCase()
  return path.basename(fileName, '.svg') + (extname ? `.${extname}` : '')
}

/**
 * Really long strings in XML files will crash the Android build and app.
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

/**
 * Convert an SVG file into either a VectorDrawable or a set of PNGs.
 *
 * The file path will be flattened, e.g. /assets/icons/example.svg will become either:
 *
 *   /drawable/assets_icons_example.xml
 *
 *   OR
 *
 *   /drawable-mdpi/assets_icons_example.png
 *   /drawable-hdpi/assets_icons_example.png
 *   ...
 *
 * @param relativePath The SVG file's path, relative to the workspace root.
 * @param data SVG file data
 */
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
    const directoryName = '/drawable'

    const vectorDrawable = VectorDrawable.createFile(convert(svg))

    await fs.promises.mkdir(directoryName)
    await fs.promises.writeFile(path.join(directoryName, name), vectorDrawable)
  } else {
    const name = formatDrawableName(relativePath, 'png')

    await Promise.all(
      ALL_PIXEL_DENSITIES.map(async density => {
        const directoryName = `/drawable-${density.name}`

        const { width, height } = svg.params.viewBox ?? { width: 0, height: 0 }
        const png = await rasterize(data, {
          width: width * density.scale,
          height: height * density.scale,
        })

        await fs.promises.mkdir(directoryName)
        await fs.promises.writeFile(path.join(directoryName, name), png)
      })
    )
  }

  return fs
}
