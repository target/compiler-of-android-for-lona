import { createBuildScript, DEFAULT_BUILD_CONFIG } from '../gradle'

describe('Android / Gradle', () => {
  test('creates a gradle file', () => {
    const buildScript = createBuildScript(DEFAULT_BUILD_CONFIG)

    expect(buildScript).toMatchSnapshot()
  })
})
