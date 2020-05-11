<?xml version="1.0"?>
<recipe>

    <#--  Merge manifest  -->
    <merge from="AndroidManifest.xml.ftl"
             to="${escapeXmlAttribute(manifestOut)}/AndroidManifest.xml" />

    <#--  Merge gradle properties  -->
    <merge from="gradle.properties.ftl"
             to="${escapeXmlAttribute(topOut)}/gradle.properties" />

    <#--  Merge values  -->
    <merge from="res/values/strings.xml"
             to="${escapeXmlAttribute(resOut)}/values/strings.xml" />
    <merge from="res/values/styles.xml"
             to="${escapeXmlAttribute(resOut)}/values/styles.xml" />

    <#--  Copy misc resources  -->
    <copy from="res/menu/menu_gallery.xml"
            to="${escapeXmlAttribute(resOut)}/menu/menu_gallery.xml" />
    <copy from="res/xml/searchable.xml"
            to="${escapeXmlAttribute(resOut)}/xml/searchable.xml" />

    <#--  Copy layout resources  -->
    <copy from="res/layout/activity_gallery.xml"
          to="${escapeXmlAttribute(resOut)}/layout/activity_gallery.xml" />
    <copy from="res/layout/content_gallery.xml"
          to="${escapeXmlAttribute(resOut)}/layout/content_gallery.xml" />
    <copy from="res/layout/fragment_icon_list.xml"
          to="${escapeXmlAttribute(resOut)}/layout/fragment_icon_list.xml" />
    <copy from="res/layout/fragment_icon_row.xml"
          to="${escapeXmlAttribute(resOut)}/layout/fragment_icon_row.xml" />

    <#--  Instantiate class templates  -->
    <instantiate from="src/app_package/Gallery.kt.ftl"
                   to="${escapeXmlAttribute(srcOut)}/Gallery.kt" />
    <instantiate from="src/app_package/GalleryActivity.kt.ftl"
                   to="${escapeXmlAttribute(srcOut)}/GalleryActivity.kt" />
    <instantiate from="src/app_package/IconListFragment.kt.ftl"
                   to="${escapeXmlAttribute(srcOut)}/IconListFragment.kt" />
    <instantiate from="src/app_package/IconListRecyclerViewAdapter.kt.ftl"
                   to="${escapeXmlAttribute(srcOut)}/IconListRecyclerViewAdapter.kt" />

    <#--  Dependencies  -->
    <dependency mavenUrl="org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.3.50" />
    <dependency mavenUrl="androidx.appcompat:appcompat:1.1.0" />
    <dependency mavenUrl="androidx.core:core-ktx:1.2.0" />
    <dependency mavenUrl="androidx.legacy:legacy-support-v4:1.0.0" />
    <dependency mavenUrl="androidx.recyclerview:recyclerview:1.0.0" />
    <dependency mavenUrl="com.google.android.material:material:1.1.0" />
    <dependency mavenUrl="androidx.constraintlayout:constraintlayout:1.1.3" />

</recipe>
