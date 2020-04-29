import path from 'path'
import { createFs } from 'buffs'
import * as XML from '../xml/ast'
import { printElement } from '../xml/print'

function createKotlinAssetGallery(
  packageName: string,
  drawableResourceNames: string[]
): string {
  const drawableResources = drawableResourceNames
    .map(name => `${' '.repeat(8)}GalleryItem("${name}", R.drawable.${name})`)
    .join(',\n')

  return `package ${packageName}.gallery

import ${packageName}.R

object Gallery {

    /*
     * A list of all generated assets.
     */
    val ALL_ASSETS = listOf(
${drawableResources}
    )

    /**
     * An item representing a generated asset.
     */
    data class GalleryItem(val id: String, val resourceId: Int)
}
`
}

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

const formatDrawableName = (name: string): string => {
  return name.replace(/[\/\-]/g, '_').toLowerCase()
}

export type Library = {
  packageName: string
  androidManifest?: string
  buildScript?: string
  colorResources?: string
  elevationResources?: string
  textStyleResources?: string
  drawableResources: [string, string][]
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
 * @param rootPath
 * @param library
 * @returns An in-memory filesystem containing the generated files
 */
export function createLibraryFiles(rootPath: string, library: Library) {
  const drawables = library.drawableResources.map(([key, value]) => [
    path.join('src/main/res/drawable', formatDrawableName(key)),
    value,
  ])

  return createFs(
    {
      '.gitignore': '/build\n',
      ...(library.buildScript && { 'build.gradle': library.buildScript }),
      ...(library.androidManifest && {
        'src/main/AndroidManifest.xml': library.androidManifest,
      }),
      ...(library.colorResources && {
        'src/main/res/values/colors.xml': library.colorResources,
      }),
      ...(library.elevationResources && {
        'src/main/res/values/elevations.xml': library.elevationResources,
      }),
      ...(library.textStyleResources && {
        'src/main/res/values/text-styles.xml': library.textStyleResources,
      }),
      ...(drawables.length > 0 && Object.fromEntries(drawables)),
      ...(drawables.length > 0 && {
        [path.join(
          'src/main/java',
          library.packageName.replace(/[.]/g, '/'),
          'gallery/Gallery.kt'
        )]: createKotlinAssetGallery(
          library.packageName,
          library.drawableResources.map(pair =>
            formatDrawableName(pair[0]).slice(0, -4)
          )
        ),
      }),
    },
    rootPath
  )
}
