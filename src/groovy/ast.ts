export type Program = {
  type: 'program'
  content: (Block | Content)[]
}

export type Block = {
  type: 'block'
  name: string
  content: (Block | Content)[]
}

export type Content = {
  type: 'content'
  value: string
}

export type Node = Program | Block | Content
