import { createFiles } from '../drawable'
import { DEFAULT_DRAWABLE_NAME_TEMPLATE } from '../../android/drawableResources'

const nameTemplate = DEFAULT_DRAWABLE_NAME_TEMPLATE

describe('SVG / Drawable', () => {
  test('converts an SVG file to a VectorDrawable when possible', async () => {
    const svg = `<svg width="24px" height="24px" viewBox="0 0 24 24">
  <path d="M0,0 L10,10" ></path>
</svg>`

    const fs = await createFiles('assets/icons/test.svg', Buffer.from(svg), {
      nameTemplate,
    })

    expect(fs.existsSync('/drawable/assets_icons_test.xml')).toEqual(true)

    expect(fs.existsSync('/drawable-hdpi/assets_icons_test.webp')).toEqual(
      false
    )
  })

  test('falls back to converting an SVG file to a set of PNGs', async () => {
    const svg = `<svg width="24px" height="24px" viewBox="0 0 24 24">
  <animate attributeName="rx" values="0;5;0" dur="10s" repeatCount="indefinite" />
  <path d="M0,0 L10,10"></path>
</svg>`

    const fs = await createFiles('assets/icons/test.svg', Buffer.from(svg), {
      nameTemplate,
    })

    expect(fs.existsSync('/drawable/assets_icons_test.xml')).toEqual(false)

    expect(fs.existsSync('/drawable-mdpi/assets_icons_test.webp')).toEqual(true)
    expect(fs.existsSync('/drawable-hdpi/assets_icons_test.webp')).toEqual(true)
    expect(fs.existsSync('/drawable-xhdpi/assets_icons_test.webp')).toEqual(
      true
    )
    expect(fs.existsSync('/drawable-xxhdpi/assets_icons_test.webp')).toEqual(
      true
    )
    expect(fs.existsSync('/drawable-xxxhdpi/assets_icons_test.webp')).toEqual(
      true
    )
  })
})
