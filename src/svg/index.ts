import fs from 'fs'
import { convert as convertSvg, SVG, Rect, Path } from '@lona/svg-model'
import * as VectorDrawable from '../android/vectorDrawable'

export function parse(svgString: string): Promise<SVG> {
  return convertSvg(svgString)
}

function convertPath(path: Path): VectorDrawable.Path {
  const { commands, style } = path.data.params

  const hasStroke = style.stroke && style.strokeWidth > 0

  return {
    pathData: commands,
    ...(style.fill && { fillColor: style.fill }),
    ...(hasStroke && { strokeColor: style.stroke }),
    ...(hasStroke && { strokeWidth: style.strokeWidth }),
    ...(hasStroke &&
      style.strokeLineCap !== 'butt' && {
        strokeLineCap: style.strokeLineCap,
      }),
  }
}

export function convert(model: SVG): VectorDrawable.Vector {
  const viewBox: Rect = model.params.viewBox || {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }

  return {
    width: viewBox.width,
    height: viewBox.height,
    viewportWidth: viewBox.width,
    viewportHeight: viewBox.height,
    elements: model.children.map(convertPath),
  }
}

export async function convertFile(filePath: string): Promise<string> {
  const data = fs.readFileSync(filePath, 'utf8')
  const svg = await parse(data)
  const vector = convert(svg)
  return VectorDrawable.createFile(vector)
}
