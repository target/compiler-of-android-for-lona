import * as XML from '../ast'
import * as fs from 'fs'
import * as path from 'path'
import print from '../print'

describe('XML', () => {
  test('prints a valid document', () => {
    const testFile = fs.readFileSync(path.join(__dirname, 'test.xml'), 'utf8')

    const doc: XML.Document = {
      prolog: {
        xmlDecl: {
          version: '1.0',
          encoding: 'UTF-8',
        },
      },
      element: {
        tag: 'root',
        attributes: [],
        content: [
          {
            type: 'comment',
            data: 'Test comment',
          },
          {
            type: 'element',
            data: {
              tag: 'color',
              attributes: [{ name: 'name', value: 'test_color_1' }],
              content: [{ type: 'charData', data: '#AABBCC' }],
            },
          },
          {
            type: 'element',
            data: {
              tag: 'color',
              attributes: [{ name: 'name', value: 'test_color_2' }],
              content: [{ type: 'charData', data: '#DDEEFF' }],
            },
          },
        ],
      },
    }

    expect(print(doc)).toBe(testFile)
  })
})
