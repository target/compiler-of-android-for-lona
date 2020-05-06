import { createLibraryFiles } from '../library'
import { createFs } from 'buffs'

describe('Android / Library', () => {
  test('creates a library module', () => {
    const { volume } = createLibraryFiles('/', {
      packageName: 'com.lona.test',
      generateGallery: true,
      drawableResources: [
        ['test.svg', createFs({ 'drawable/test.xml': '' }).fs],
      ],
    })

    expect(volume.toJSON()).toMatchSnapshot()
  })
})
