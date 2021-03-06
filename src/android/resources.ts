import { copy, createFs, IFS } from 'buffs'
import path from 'path'
import * as XML from '../xml/ast'
import { createFile } from './valueResources'

function createValueResourcesFile(elements: XML.Element[]): string {
  return createFile(
    elements.map(element => ({ type: 'element', data: element }))
  )
}

/**
 * Generate Android resource files at the specified path.
 *
 * The following files may be generated:
 *
 * res
 * ├── drawable
 * │   └── <various drawables>
 * ├── drawable-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}
 * │   └── <various drawables>
 * └── values
 *     └── <various values>.xml
 *
 * @param resPath
 * @param library
 * @returns An in-memory filesystem containing the generated files
 */
export function createResourceFiles(
  resPath: string,
  {
    colorResources,
    elevationResources,
    textStyleResources,
    attrResources,
    drawableResources,
    layoutResources,
  }: {
    colorResources: XML.Element[]
    elevationResources: XML.Element[]
    textStyleResources: XML.Element[]
    attrResources: XML.Element[]
    layoutResources: IFS
    drawableResources: [string, IFS][]
  }
): IFS {
  const target = createFs()

  target.mkdirSync(resPath, { recursive: true })

  const valuesPath = path.join(resPath, 'values')

  target.mkdirSync(valuesPath, { recursive: true })

  if (colorResources.length > 0) {
    target.writeFileSync(
      path.join(valuesPath, 'colors.xml'),
      createValueResourcesFile(colorResources)
    )
  }

  if (elevationResources.length > 0) {
    target.writeFileSync(
      path.join(valuesPath, 'elevations.xml'),
      createValueResourcesFile(elevationResources)
    )
  }

  if (textStyleResources.length > 0) {
    target.writeFileSync(
      path.join(valuesPath, 'text-styles.xml'),
      createValueResourcesFile(textStyleResources)
    )
  }

  if (attrResources.length > 0) {
    target.writeFileSync(
      path.join(valuesPath, 'attrs.xml'),
      createValueResourcesFile(attrResources)
    )
  }

  const layoutPath = path.join(resPath, 'layout')

  target.mkdirSync(layoutPath, { recursive: true })

  copy(layoutResources, target, '/', layoutPath)

  // Drawable resources are already in the appropriate main/drawable* directory
  drawableResources.forEach(([key, source]) => {
    copy(source, target, '/', resPath)
  })

  return target
}

/**
 * Returns true if the given path is in the res directory
 *
 * @param filepath Path to file
 */
export function isResourcePath(filepath: string): boolean {
  const parts = filepath.split(path.sep)
  return parts.includes('res')
}
