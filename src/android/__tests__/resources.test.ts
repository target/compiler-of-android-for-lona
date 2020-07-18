import { createResourceFiles } from '../resources'
import { createFs, toJSON } from 'buffs'

describe('Android / Resources', () => {
  test('creates library resources', () => {
    const fs = createResourceFiles('/main/res', {
      colorResources: [],
      textStyleResources: [],
      elevationResources: [],
      attrResources: [],
      drawableResources: [['test.svg', createFs({ 'drawable/test.xml': '' })]],
      layoutResources: createFs({ 'row.xml': '' }),
    })

    expect(toJSON(fs)).toMatchSnapshot()
  })
})
