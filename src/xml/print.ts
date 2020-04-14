import { Doc, print } from '@lona/compiler/lib/utils/printer'

import * as XML from './ast'
import { formatDocument } from './format'

const printerOptions = { printWidth: 80, tabWidth: 2, useTabs: false }

export default function printXml(document: XML.Document) {
  return print(formatDocument(document), printerOptions)
}
