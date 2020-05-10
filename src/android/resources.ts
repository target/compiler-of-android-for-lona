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
    drawableResources,
  }: {
    colorResources: XML.Element[]
    elevationResources: XML.Element[]
    textStyleResources: XML.Element[]
    drawableResources: [string, IFS][]
  }
): ReturnType<typeof createFs> {
  const files = createFs()
  const { fs: target } = files

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

  // Drawable resources are already in the appropriate main/drawable* directory
  drawableResources.forEach(([key, source]) => {
    copy(source, target, '/', resPath)
  })

  return files
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
