import { TextStyleValue } from '@lona/compiler/lib/plugins/tokens/tokens-ast'
import * as XML from '../xml/ast'
import { createStyle, createItem, cssToHexColor } from '../android/resources'

export type Token = {
  qualifiedName: string[]
  value: TextStyleValue
}

export type Options = {
  minSdk: number
}

export const convert = (token: Token, options: Options): XML.Element => {
  const {
    fontFamily,
    fontSize,
    fontWeight,
    color,
    lineHeight,
    letterSpacing,
  } = token.value

  let items: XML.Element[] = []

  if (fontFamily) {
    items.push(createItem('android:fontFamily', fontFamily))
  }

  if (fontSize) {
    items.push(createItem('android:textSize', `${fontSize}sp`))
  }

  if (options.minSdk >= 26 && fontWeight) {
    items.push(createItem('android:fontWeight', `${fontWeight}`))
  }

  if (color) {
    items.push(createItem('android:textColor', cssToHexColor(color.css)))
  }

  if (lineHeight && fontSize) {
    items.push(
      createItem('android:lineSpacingMultiplier', `${lineHeight / fontSize}`)
    )
  }

  if (letterSpacing) {
    items.push(createItem('android:letterSpacing', `${letterSpacing}`))
  }

  return createStyle(token.qualifiedName.join('_'), items)
}
