export type PixelDensity = {
  name: string
  value: number
  scale: number
}

export const ALL_PIXEL_DENSITIES: PixelDensity[] = [
  { name: 'mdpi', value: 160, scale: 1 },
  { name: 'hdpi', value: 240, scale: 1.5 },
  { name: 'xhdpi', value: 320, scale: 2 },
  { name: 'xxhdpi', value: 480, scale: 3 },
  { name: 'xxxhdpi', value: 640, scale: 4 },
]
