import { Doc, print } from '@lona/compiler/lib/utils/printer'

import * as XML from './ast'
import { formatDocument, formatElement } from './format'

const printerOptions = { printWidth: 80, tabWidth: 2, useTabs: false }

export default function printXml(document: XML.Document) {
  return print(formatDocument(document), printerOptions)
}

export function printElement(element: XML.Element) {
  return print(formatElement(element), printerOptions)
}
