import sharp from 'sharp'

export async function rasterize(
  svgData: Buffer,
  { width, height }: { width: number; height: number }
): Promise<Buffer> {
  const outputBuffer = await sharp(svgData, { density: 2400 })
    .resize(width, height)
    .webp()
    .toBuffer()

  return outputBuffer
}
