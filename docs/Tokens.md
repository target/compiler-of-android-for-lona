# Tokens

This page outlines our strategy for converting Lona variables to definitions consumable in Android apps.

- [Colors](#colors)
- [Text Styles](#text-styles)
- [Shadows](#shadows)

## Strategy

Definitions of shared colors, text styles, and elevations are most commonly defined as resources in XML. While it's possible to define these using Kotlin, it's not idiomatic. For this reason, we "flatten" dynamic Lona values (e.g. function calls) into constants that can be represented in XML (CSS has similar limitations).

## Converting

All XML definitions for tokens are generated in `res/values/`.

### Colors

Lona color definitions are converted to `<color>` resources.

<details>
  <summary>Example</summary>

Lona definition:

```swift
let primary: Color = #color(css: "#cc0000")
```

Generated code:

```xml
<color name="primary">#cc0000</color>
```

</details>

### Text Styles

Lona text styles are converted to `<style>` resources.

<details>
  <summary>Example</summary>

Lona definition:

```swift
let heading1: TextStyle = TextStyle(
  fontFamily: Optional.value("Helvetica"),
  fontWeight: FontWeight.bold,
  fontSize: Optional.value(28),
  lineHeight: Optional.value(36),
  letterSpacing: Optional.value(0.2),
  color: Optional.value(#color(css: "teal"))
)
```

Generated code:

```xml
<style name="heading1">
  <item name="android:fontFamily">Helvetica</item>
  <item name="android:textSize">28sp</item>
  <item name="android:fontWeight">700</item>
  <item name="android:textColor">#008080</item>
  <item name="android:lineSpacingMultiplier">1.286</item>
  <item name="android:letterSpacing">0.2</item>
</style>
```

</details>

<details>
  <summary>Example with color reference</summary>

Lona definition:

```swift
let link: TextStyle = TextStyle(
  color: Optional.value(primary)
)
```

Generated code:

```xml
<style name="heading1">
  <item name="android:textColor">@color/primary</item>
</style>
```

</details>

### Shadows

Shadows on Android are specified using an `elevation` size. We generate a `<dimen>` resource to represent this size. We prefix its name with `elevation` so that it's less likely to be used for other purposes.

By default, Lona will automatically estimate the nearest elevation size based on the shadow's parameters. Lona also allows specifying an elevation to use for a particular shadow instead of the default estimate.

Lona will not attempt to generate a custom drawable to exactly match the defined shadow.

> As of API 28, shadow color is configurable: https://developer.android.com/reference/android/view/View.html#setOutlineAmbientShadowColor(int). We could consider supporting this depending on which API we're generating code for.

<details>
  <summary>Example with default estimate</summary>

Lona definition:

```swift
let small: Shadow = Shadow(x: 0, y: 2, blur: 2, radius: 0, color: #color(css: "black"))
```

Generated code:

```xml
<dimen name="elevation_small">2dp</dimen>
```

</details>

<details>
  <summary>Example with specified elevation</summary>

Lona definition:

```swift
let small: Shadow = Shadow(x: 0, y: 2, blur: 2, radius: 0, color: #color(css: "black"), elevation: Optional.value(4))
```

Generated code:

```xml
<dimen name="elevation_small">4dp</dimen>
```

</details>
