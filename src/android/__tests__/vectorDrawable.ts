import * as XML from '../../xml/ast'
import { vectorElement, Vector } from '../vectorDrawable'

describe('Android / VectorDrawable', () => {
  test('converts a vector', () => {
    const vector = vectorElement({
      width: 24,
      height: 24,
      viewportWidth: 24,
      viewportHeight: 24,
      elements: [
        {
          pathData: [
            { type: 'move', data: { to: { x: 0, y: 0 } } },
            { type: 'line', data: { to: { x: 0, y: 4 } } },
          ],
          fillColor: '#FFFFFF',
        },
      ],
    })

    const mock: XML.Element = {
      tag: 'vector',
      attributes: [
        {
          name: 'xmlns:android',
          value: 'http://schemas.android.com/apk/res/android',
        },
        {
          name: 'android:width',
          value: '24dp',
        },
        {
          name: 'android:height',
          value: '24dp',
        },
        {
          name: 'android:viewportWidth',
          value: '24',
        },
        {
          name: 'android:viewportHeight',
          value: '24',
        },
      ],
      content: [
        {
          type: 'element',
          data: {
            tag: 'path',
            attributes: [
              {
                name: 'android:pathData',
                value: 'M0,0L0,4',
              },
              {
                name: 'android:fillColor',
                value: '#FFFFFF',
              },
            ],
            content: [],
          },
        },
      ],
    }

    expect(vector).toEqual(mock)
  })
})
