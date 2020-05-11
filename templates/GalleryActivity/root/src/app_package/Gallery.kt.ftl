package ${packageName};

object Gallery {

    /**
     * An item representing a generated asset.
     */
    data class GalleryItem(val id: String, val resourceId: Int)

    <#if drawableAssetList?? && drawableAssetList?has_content>
    /*
     * A list of all generated assets.
     */
    val ALL_ASSETS = listOf(
        <#list drawableAssetList as drawableAsset>GalleryItem("${drawableAsset}", R.drawable.${drawableAsset})<#sep>,
        </#sep></#list>   
    )
    </#if>
}
