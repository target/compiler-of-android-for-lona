import path from 'path'
import * as XML from '../xml/ast'
import print from '../xml/print'
import { inflate, Context } from '../freemarker'
import {
  removeWhitespace,
  parse,
  mergeElementsByUniqueAttribute,
  MERGE_ATTRIBUTES_CHOOSE_SOURCE,
  printElement,
} from '../xml'

export const DEFAULT_VALUE_NAME_TEMPLATE = '${qualifiedName?join("_")}'

export type Options = {
  nameTemplate: string
}

export function formatQualifiedName(qualifiedName: string[], options: Options) {
  return inflate(options.nameTemplate, new Context({ qualifiedName }))
}

const parseCSSColor: (color: string) => number[] = require('csscolorparser')
  .parseCSSColor

export function cssToHexColor(cssColor: string): string {
  const toHex = (value: number): string => {
    const converted = value.toString(16)
    if (converted.length === 1) {
      return `0${converted}`
    } else {
      return converted
    }
  }

  const [r, g, b, a] = parseCSSColor(cssColor)
  const components = [r, g, b, ...(a !== 1 ? [Math.ceil(a * 255)] : [])]

  return (
    '#' +
    components
      .map(toHex)
      .join('')
      .toUpperCase()
  )
}

export const createColor = (name: string, value: string): XML.Element => {
  return {
    tag: 'color',
    attributes: [{ name: 'name', value: name }],
    content: [{ type: 'charData', data: value }],
  }
}

export const createDimen = (name: string, value: string): XML.Element => {
  return {
    tag: 'dimen',
    attributes: [{ name: 'name', value: name }],
    content: [{ type: 'charData', data: value }],
  }
}

export const createItem = (name: string, value: string): XML.Element => {
  return {
    tag: 'item',
    attributes: [{ name: 'name', value: name }],
    content: [{ type: 'charData', data: value }],
  }
}

export const createStyle = (
  name: string,
  items: XML.Element[]
): XML.Element => {
  return {
    tag: 'style',
    attributes: [{ name: 'name', value: name }],
    content: items.map(item => ({ type: 'element', data: item })),
  }
}

export const createAttr = (name: string, format: string): XML.Element => {
  return {
    tag: 'attr',
    attributes: [
      { name: 'name', value: name },
      { name: 'format', value: format },
    ],
    content: [],
  }
}

export const createStyleableDeclaration = (
  name: string,
  items: XML.Element[]
): XML.Element => {
  return {
    tag: 'declare-styleable',
    attributes: [{ name: 'name', value: name }],
    content: items.map(item => ({ type: 'element', data: item })),
  }
}

/**
 * Create a resource XML file using the following format:
 *
 * <?xml version="1.0" encoding="utf-8"?>
 * <resources>
 *   ...
 * </resources>
 */
export const createFile = (resources: XML.Content[]): string => {
  const document: XML.Document = {
    prolog: {
      xmlDecl: {
        version: '1.0',
        encoding: 'utf-8',
      },
    },
    element: {
      tag: 'resources',
      attributes: [],
      content: resources,
    },
  }

  return print(document)
}

/**
 * Returns true if the given path is a value resource file
 *
 * @param filepath Path to file
 */
export function isValueResourcePath(filepath: string): boolean {
  const parts = filepath.split(path.sep)
  const resIndex = parts.findIndex(part => part === 'res')
  return (
    resIndex >= 0 &&
    parts.length > resIndex &&
    parts[resIndex + 1].startsWith('values')
  )
}

export function mergeValueResourceFiles(
  sourceXmlString: string,
  targetXmlString: string
): string {
  const source = removeWhitespace(parse(sourceXmlString))
  const target = removeWhitespace(parse(targetXmlString))

  const merged = mergeElementsByUniqueAttribute(
    source,
    target,
    MERGE_ATTRIBUTES_CHOOSE_SOURCE,
    'name'
  )

  return printElement(merged)
}
