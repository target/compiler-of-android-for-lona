import { createBuildScript, DEFAULT_BUILD_CONFIG } from '../gradle'
import { createLibraryFiles, createManifest } from '../library'

describe('Android / Library', () => {
  test('creates a library module', () => {
    const { volume } = createLibraryFiles('/', {
      packageName: 'com.lona.test',
      buildScript: createBuildScript(DEFAULT_BUILD_CONFIG),
      androidManifest: createManifest('com.lona.test'),
      drawableResources: [],
    })

    expect(volume.toJSON()).toMatchSnapshot()
  })
})
