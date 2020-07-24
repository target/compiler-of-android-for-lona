import { createModule } from '@lona/compiler/lib/logic/module'
import {
  convertComponentParameter,
  ComponentParameter,
} from '../componentParameter'
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

    const workspaceFs = createFs({
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

    const result: ComponentParameter = {
      name: 'titleText',
      type: 'CharSequence',
      defaultValue: '""',
      styleableAttribute: {
        getter: 'getString',
        format: 'string',
      },
    }

    expect(componentParameter).toEqual(result)
  })
})
