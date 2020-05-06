import path from 'path'
import { createFs, IFS, copy } from 'buffs'
import * as XML from '../xml/ast'
import { printElement } from '../xml/print'
import { formatDrawableName } from '../svg/drawable'
import { createKotlinAssetGallery, createGalleryFiles } from './gallery'

export type Library = {
  packageName: string
  colorResources?: string
  elevationResources?: string
  textStyleResources?: string
  drawableResources: [string, IFS][]
  generateGallery: boolean
}

/**
 * Generate an Android library module at the specified path.
 *
 * The following files may be generated:
 *
 * .
 * └── src
 *     └── main
 *         ├── java
 *         │   └── ${packageName}
 *         │       └── gallery
 *         │           └── Gallery.kt
 *         └── res
 *             ├── drawable
 *             │   └── <various drawables>
 *             └── values
 *                 └── <various values>.xml
 *
 * @param srcPath
 * @param library
 * @returns An in-memory filesystem containing the generated files
 */
export function createLibraryFiles(srcPath: string, library: Library) {
  const classPath = path.join(
    srcPath,
    'main/java',
    library.packageName.replace(/[.]/g, '/')
  )

  const target = createFs(
    {
      ...(library.colorResources && {
        'main/res/values/colors.xml': library.colorResources,
      }),
      ...(library.elevationResources && {
        'main/res/values/elevations.xml': library.elevationResources,
      }),
      ...(library.textStyleResources && {
        'main/res/values/text-styles.xml': library.textStyleResources,
      }),
    },
    srcPath
  )

  if (library.drawableResources && library.generateGallery) {
    const gallery = createGalleryFiles(
      library.packageName,
      library.drawableResources.map(pair => formatDrawableName(pair[0]))
    )
    copy(gallery, target.fs, '/', path.join(srcPath, classPath))
  }

  library.drawableResources.forEach(([key, source]) => {
    copy(source, target.fs, '/', path.join(srcPath, 'main/res'))
  })

  return target
}
