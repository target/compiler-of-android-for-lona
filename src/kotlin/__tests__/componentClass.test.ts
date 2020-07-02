import { createComponentClass } from '../componentClass'

describe('Kotlin / Component', () => {
  it('creates a component class', () => {
    const componentClass = createComponentClass({
      namePrefix: 'Example',
      packagePath: 'com.example',
      imports: ['android.widget.TextView'],
      parameters: [
        {
          name: 'titleText',
          type: 'CharSequence',
          defaultValue: `""`,
          styleableAttribute: {
            getter: 'getString',
            format: 'string',
          },
        },
      ],
      publicViews: [
        {
          name: 'text',
          type: 'TextView',
        },
      ],
    })

    expect(componentClass).toMatchSnapshot()
  })
})
