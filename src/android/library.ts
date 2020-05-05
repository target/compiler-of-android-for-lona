import path from 'path'
import { createFs, IFS, copy } from 'buffs'
import * as XML from '../xml/ast'
import { printElement } from '../xml/print'
import { formatDrawableName } from '../svg/drawable'
import { createKotlinAssetGallery, createGalleryFiles } from './gallery'

/**
 * Create an Android manifest file for a library module.
 *
 * @param packageName Identifier like "com.lona.my_library"
 */
export function createManifest(packageName: string): string {
  const root: XML.Element = {
    tag: 'manifest',
    attributes: [
      {
        name: 'xmlns:android',
        value: 'http://schemas.android.com/apk/res/android',
      },
      {
        name: 'package',
        value: packageName,
      },
    ],
    content: [],
  }

  return printElement(root)
}

export type Library = {
  packageName: string
  androidManifest?: string
  buildScript?: string
  colorResources?: string
  elevationResources?: string
  textStyleResources?: string
  generateGallery: boolean
  drawableResources: [string, IFS][]
}

/**
 * Generate an Android library module at the specified path.
 *
 * The following files may be generated:
 *
 * .
 * ├── .gitignore
 * ├── build.gradle
 * └── src
 *     └── main
 *         ├── AndroidManifest.xml
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
    'src/main/java',
    library.packageName.replace(/[.]/g, '/')
  )

  const target = createFs(
    {
      // '.gitignore': '/build\n',
      // ...(library.buildScript && { 'build.gradle': library.buildScript }),
      // ...(library.androidManifest && {
      //   'src/main/AndroidManifest.xml': library.androidManifest,
      // }),
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

  // if (library.drawableResources && library.generateGallery) {
  //   const gallery = createGalleryFiles(
  //     library.packageName,
  //     library.drawableResources.map(pair => formatDrawableName(pair[0]))
  //   )
  //   copy(gallery, target.fs, '/', path.join(srcPath, classPath))
  // }

  library.drawableResources.forEach(([key, source]) => {
    copy(source, target.fs, '/', path.join(srcPath, 'main/res'))
  })

  return target
}
