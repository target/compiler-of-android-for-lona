import { createModule } from '../../logic/module'
import { convertComponentParameter } from '../componentParameter'
import { createFs } from 'buffs'
import { findComponentFunction } from '../../logic/component'

const lonaJson = JSON.stringify({
  format: {
    android: {
      packageName: 'com.example.library',
    },
  },
})

describe('Kotlin / Component', () => {
  it('generates a component parameter', () => {
    const componentFile = `
func Test(titleText: String = "") -> Element {
  return View()
}
`

    const { fs: workspaceFs } = createFs({
      'lona.json': lonaJson,
      'Test.cmp': componentFile,
    })

    const moduleContext = createModule(workspaceFs, '/')

    const componentFunction = findComponentFunction(
      moduleContext.componentFiles[0]!.rootNode
    )

    const componentParameter = convertComponentParameter(
      moduleContext,
      componentFunction!.parameters[0]
    )

    expect(componentParameter).toEqual({
      name: 'titleText',
      type: 'CharSequence',
      defaultValue: '""',
      attributeGetter: 'getString',
    })
  })
})
