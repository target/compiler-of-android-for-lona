import * as XML from '../xml/ast'
import { getChildrenElements, getAttributes } from '../xml/traverse'

export type Instantiate = {
  from: string
  to: string
}

export type Copy = {
  from: string
  to: string
}

export type Merge = {
  from: string
  to: string
}

export type MakeDirectory = {
  at: string
}

export type Dependency = { url: string }

export type Command =
  | { type: 'instantiate'; value: Instantiate }
  | { type: 'copy'; value: Copy }
  | { type: 'merge'; value: Merge }
  | { type: 'mkdir'; value: MakeDirectory }
  | { type: 'dependency'; value: Dependency }

export type Recipe = Command[]

export function parse(root: XML.Element): Command[] {
  return getChildrenElements(root).flatMap(
    (element: XML.Element): Command[] => {
      const attributes = getAttributes(element)

      switch (element.tag) {
        case 'copy':
        case 'instantiate':
        case 'merge':
          return [
            {
              type: element.tag,
              value: { from: attributes.from, to: attributes.to },
            },
          ]
        case 'mkdir':
          return [
            {
              type: 'mkdir',
              value: { at: attributes.at },
            },
          ]
        case 'dependency':
          function dependencyUrl(attributes: {
            [key: string]: string
          }): string {
            if (attributes.mavenUrl) {
              return attributes.mavenUrl
            }

            if (
              attributes.name === 'android-support-v4' &&
              attributes.revision
            ) {
              return `com.android.support:support-v4`
            }

            console.error('Unknown <dependency> in recipe', element)

            return ''
          }

          return [
            {
              type: 'dependency',
              value: { url: dependencyUrl(attributes) },
            },
          ]
        default:
          console.error('Unknown recipe command', element.tag)
          return []
      }
    }
  )
}
