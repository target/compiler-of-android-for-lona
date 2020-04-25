import { Doc, builders, indent, group } from '@lona/compiler/lib/utils/printer'
import { assertNever } from '@lona/compiler/lib/utils/assert-never'

import * as Xml from './ast'

const { line, softline, hardline, concat, join } = builders

const quoted = (doc: Doc): Doc => concat(['"', doc, '"'])

export const formatDocument = (document: Xml.Document): Doc =>
  concat([
    formatProlog(document.prolog),
    hardline,
    formatElement(document.element),
  ])

const formatProlog = (prolog: Xml.Prolog): Doc =>
  prolog.xmlDecl ? formatXmlDecl(prolog.xmlDecl) : ''

const formatXmlDecl = (xmlDecl: Xml.XmlDecl): Doc =>
  concat([
    '<?xml version=',
    quoted(xmlDecl.version),
    ...(xmlDecl.encoding ? [' encoding=', quoted(xmlDecl.encoding)] : []),
    '?>',
  ])

export const formatElement = (element: Xml.Element): Doc => {
  const opening = concat(['<', element.tag])

  const attributes =
    element.attributes.length > 0
      ? indent([
          line,
          group(join(line, element.attributes.map(formatAttribute))),
        ])
      : ''

  if (element.content.length === 0) {
    return group([opening, attributes, ' />'])
  }

  return group([
    group([opening, attributes, '>']),
    group(
      indent([softline, join(softline, element.content.map(formatContent))])
    ),
    softline,
    concat(['</', element.tag, '>']),
  ])
}

const formatContent = (content: Xml.Content): Doc => {
  switch (content.type) {
    case 'comment':
      return formatComment(content.data)
    case 'charData':
      return formatCharData(content.data)
    case 'element':
      return formatElement(content.data)
    default:
      assertNever(content)
  }
}

const formatAttribute = (attribute: Xml.Attribute): Doc =>
  group([
    attribute.name,
    '=',
    indent(concat([softline, quoted(attribute.value)])),
  ])

const formatComment = (comment: Xml.Comment): Doc => `<!-- ${comment} -->`

/* TODO: Escape */
const formatCharData = (charData: Xml.CharData): Doc => charData
