import * as XML from '../ast'
import * as fs from 'fs'
import * as path from 'path'
import print from '../print'
import { parse } from '../parse'

describe('XML', () => {
  test('parses a document', () => {
    const xml = `<root>
  text
  <element1 attr1="value1" attr2="value2">nested text</element1>
  more text
  <element2 />
</root>`

    const element: XML.Element = {
      tag: 'root',
      attributes: [],
      content: [
        { type: 'charData', data: '\n  text\n  ' },
        {
          type: 'element',
          data: {
            tag: 'element1',
            attributes: [
              { name: 'attr1', value: 'value1' },
              { name: 'attr2', value: 'value2' },
            ],
            content: [{ type: 'charData', data: 'nested text' }],
          },
        },
        { type: 'charData', data: '\n  more text\n  ' },
        {
          type: 'element',
          data: {
            tag: 'element2',
            attributes: [],
            content: [],
          },
        },
        { type: 'charData', data: '\n' },
      ],
    }

    expect(parse(xml)).toEqual(element)
  })

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
