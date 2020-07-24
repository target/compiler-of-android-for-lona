import * as XML from '../../xml'
import { getConfig, Config } from '../config'

describe('Template / Config', () => {
  it('parses template.xml', () => {
    const config = XML.parse(`<template
    format="5"
    revision="2"
    name="Android Project"
    description="Creates a new Android project.">
    <category value="Application" />
    <parameter
        id="id1"
        name="name"
        type="string"
        default="test" />
    <parameter
        id="id2"
        name="flag"
        type="boolean"
        default="true" />
    <thumbs>
        <thumb>android-module.png</thumb>
    </thumbs>
    <globals file="globals.xml.ftl" />
    <execute file="recipe.xml.ftl" />
</template>`)

    const expected: Config = {
      format: '5',
      revision: '2',
      name: 'Android Project',
      category: 'Application',
      description: 'Creates a new Android project.',
      parameters: [
        { id: 'id1', name: 'name', default: 'test' },
        { id: 'id2', name: 'flag', default: true },
      ],
      globals: 'globals.xml.ftl',
      execute: 'recipe.xml.ftl',
    }

    expect(getConfig(config)).toEqual(expected)
  })
})
