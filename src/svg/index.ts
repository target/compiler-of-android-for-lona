import model, { SVG, Rect, Path } from '@lona/svg-model'
import * as VectorDrawable from '../android/vectorDrawable'

export function parse(svgString: string): SVG {
  return model(svgString)
}

function convertPath(path: Path): VectorDrawable.Path {
  return {
    pathData: path.data.params.commands,
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
