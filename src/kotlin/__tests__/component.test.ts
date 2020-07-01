import { createComponentClass } from '../component'

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
          attributeGetter: 'getString',
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
