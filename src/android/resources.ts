import path from 'path'
import { createFs, IFS, copy } from 'buffs'

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
    colorResources?: string
    elevationResources?: string
    textStyleResources?: string
    drawableResources: [string, IFS][]
  }
): ReturnType<typeof createFs> {
  const files = createFs()
  const { fs: target } = files

  const valuesPath = path.join(resPath, 'values')

  if (colorResources) {
    target.writeFileSync(path.join(valuesPath, 'colors.xml'), colorResources)
  }

  if (elevationResources) {
    target.writeFileSync(
      path.join(valuesPath, 'elevations.xml'),
      elevationResources
    )
  }

  if (textStyleResources) {
    target.writeFileSync(
      path.join(valuesPath, 'text-styles.xml'),
      textStyleResources
    )
  }

  // Drawable resources are already in the appropriate main/drawable* directory
  drawableResources.forEach(([key, source]) => {
    copy(source, target, '/', resPath)
  })

  return files
}
