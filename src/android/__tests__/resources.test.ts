import { createResourceFiles } from '../resources'
import { createFs } from 'buffs'

describe('Android / Resources', () => {
  test('creates library resources', () => {
    const { volume } = createResourceFiles('/main/res', {
      colorResources: [],
      textStyleResources: [],
      elevationResources: [],
      drawableResources: [
        ['test.svg', createFs({ 'drawable/test.xml': '' }).fs],
      ],
    })

    expect(volume.toJSON()).toMatchSnapshot()
  })
})
