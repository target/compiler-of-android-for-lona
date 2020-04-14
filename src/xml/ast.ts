export type Document = {
  prolog: Prolog
  element: Element
}

export type Prolog = { xmlDecl?: XmlDecl }

export type XmlDecl = {
  version: string
  encoding?: string
}

export type Element = {
  tag: string
  attributes: Attribute[]
  content: Content[]
}

export type Content =
  | { type: 'comment'; data: Comment }
  | { type: 'charData'; data: CharData }
  | { type: 'element'; data: Element }

export type Attribute = {
  name: string
  value: string
}

export type Comment = string

export type CharData = string
