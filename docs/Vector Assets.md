# Tokens

This page outlines our strategy for converting SVG assets to assets consumable in Android apps.

## Overview

Android doesn't support SVG natively. There are a few common ways to use SVG files on Android:

- Convert the SVG to the Android-specific XML format, `VectorDrawable`.
- Rasterize the file as a PNG, in different sizes and colors.

### VectorDrawable

The `VectorDrawable` format is generally the best way to represent an SVG, when possible. We can't use it for every SVG however, since the SVG and `VectorDrawable` formats are not 1:1 - only a subset of SVG elements can be converted reliably.

Android Studio includes a GUI utility to convert an SVG file into a `VectorDrawable`. However, this converter needs to be run manually for each individual SVG, and re-run anytime the source SVG changes.

### Parameterized SVGs

A few aspects of a `VectorDrawable` can be modified programatically, e.g. we can use `tintColor` to set the color of the whole asset. Let's call this **basic** parameterization.

However, sometimes it's desirable to be able to change individual elements of a vector at runtime. Let's call this **advanced** parameterization. It seems that individual elements of the `VectorDrawable` can't be accessed and manipulated programatically. If we need to do advanced parameterization, we'll have to fall back on Android's 2D drawing API.

Both basic and advanced parameterization may take 2 forms: **compile-time** and **run-time** parameterization. When the permutations of parameters are finite, we can pre-generate all versions of the SVG at compile-time (although if there are enough permutations, this may not be the best option). When the permutations are infinited, we have to determine how to render the SVG at run-time.

### Android's 2D drawing API

Android's 2D drawing API seems to support almost every aspect of SVGs, with possibly the exception of more advanced features like filters.

One notable drawback is that custom drawables can't be used in XML prior to API 24: https://developer.android.com/reference/android/graphics/drawable/Drawable.html#custom-drawables.

## Strategy

Lona will try to "just work": the compiler will detect the best way to convert an SVG based on how its used throughout the Lona workspace. However, if the SVG isn't used at all, or if the developer knows it may be used in more ways than just the current ones in the workspace, they can provide additional configuration/hints to the compiler.

Lona's conversion algorithm will do the following:

```
For each SVG file:
  If the SVG requires advanced AND runtime parameterization:
    Generate a custom Drawable
  Else:
    If the SVG can be converted to a VectorDrawable losslessly:
      For each advanced configuration (or the default if none exist):
        Generate a pre-configured VectorDrawable
    Else: // Lossless conversion isn't possible
      For each basic OR advanced configuration (or the default if none exist):
        For each desired size:
          Generate a pre-configured PNG
```

A few examples:

- An SVG is included in the workspace but never instantiated as an `Image` in Lona:

  - If the SVG can be losslessly converted to a VectorDrawable: the compiler will generate a single VectorDrawable
  - Otherwise: the compiler will generate N PNGs, for each desired size.

- An SVG is instantiated in Lona, with 3 different tint colors:

  - If the SVG can be losslessly converted to a VectorDrawable: the compiler will generate a single VectorDrawable
  - Otherwise: the compiler will generate 3N PNGs, for each (desired size) x (tint color).

- An SVG is instantiated in Lona, configured to support a custom fill and stroke parameter:

  - The compiler will generate a single custom Drawable

Compiler options (TBD) will allow more customization.

- E.g. if the N gets too large (> 20 PNGs for a given SVG) we instead generate a single custom drawable.
- E.g. potentially requiring a custom drawable could be considered a Lona error and designers will not be allowed to configure vector graphics in that way.

### Converting to VectorDrawable

Lona will use its `svg-model` utility to support the same elements/naming scheme/etc across Lona Studio, web, iOS, Sketch, and Android.
