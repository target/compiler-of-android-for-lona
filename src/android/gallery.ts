import { IFS, createFs } from 'buffs'

/**
 * Create a gallery class that lists every generated drawable
 */
export function createKotlinAssetGallery(
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
 * Create a gallery to showcase all assets
 */
export function createGalleryFiles(
  packageName: string,
  drawableResourceNames: string[]
): IFS {
  const gallery = createKotlinAssetGallery(packageName, drawableResourceNames)

  return createFs({
    '/gallery/Gallery.kt': gallery,
  })
}
