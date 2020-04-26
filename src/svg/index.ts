import fs from 'fs'
import model, { SVG, Rect, Path } from '@lona/svg-model'
import * as VectorDrawable from '../android/vectorDrawable'

export function parse(svgString: string): SVG {
  return model(svgString)
}

function convertPath(path: Path): VectorDrawable.Path {
  const { commands, style } = path.data.params

  return {
    pathData: commands,
    ...(style.fill && { fillColor: style.fill }),
    ...(style.stroke && { strokeColor: style.stroke }),
    ...(style.strokeWidth > 0 && { strokeWidth: style.strokeWidth }),
    ...(style.strokeLineCap !== 'butt' && {
      strokeLineCap: style.strokeLineCap,
    }),
  }
}

export function convert(model: SVG): VectorDrawable.Vector {
  const viewBox: Rect = model.data.params.viewBox || {
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
    elements: model.data.children.map(convertPath),
  }
}

export function convertFile(filePath: string): string {
  const data = fs.readFileSync(filePath, 'utf8')
  const svg = parse(data)
  const vector = convert(svg)
  return VectorDrawable.createFile(vector)
}
