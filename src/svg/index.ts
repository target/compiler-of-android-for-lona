import path from 'path'
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

export async function createFiles(
  relativePath: string,
  data: Buffer
): Promise<IFS> {
  const { fs } = createFs()

  const svg = await parse(data.toString('utf8'))
  const lossless =
    svg.metadata.unsupportedElements.length === 0 &&
    svg.metadata.unsupportedAttributes.length === 0

  if (lossless) {
    const vectorDrawable = VectorDrawable.createFile(convert(svg))
    const name = formatDrawableName(relativePath, 'xml')
    fs.mkdirSync('/drawable')
    fs.writeFileSync(path.join('/drawable', name), vectorDrawable)
  } else {
    const name = formatDrawableName(relativePath, 'png')

    for (const density of ALL_PIXEL_DENSITIES) {
      const viewBox = svg.params.viewBox
      const png = await rasterize(data, {
        width: (viewBox?.width ?? 0) * density.scale,
        height: (viewBox?.height ?? 0) * density.scale,
      })
      const directoryName = `/drawable-${density.name}`
      fs.mkdirSync(directoryName)
      fs.writeFileSync(path.join(directoryName, name), png)
    }
  }

  return fs
}
