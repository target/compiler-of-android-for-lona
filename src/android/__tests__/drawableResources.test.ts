import {
  formatDrawableName,
  DEFAULT_DRAWABLE_NAME_TEMPLATE,
} from '../drawableResources'

describe('Android / DrawableResources', () => {
  test('formats drawable names', () => {
    expect(
      formatDrawableName('a/b/c.svg', 'png', {
        nameTemplate: DEFAULT_DRAWABLE_NAME_TEMPLATE,
      })
    ).toEqual('a_b_c.png')
  })

  test('removes prefix and suffix from name', () => {
    expect(
      formatDrawableName('a/b/24px.svg', 'png', {
        nameTemplate:
          '${qualifiedName?join("_")?removeBeginning("a_")?removeEnding("_24px")}',
      })
    ).toEqual('b.png')
  })
})
