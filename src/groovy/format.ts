import { builders, Doc, indent } from '@lona/compiler/lib/utils/printer'
import * as AST from './ast'

const { hardline, concat, join } = builders

export function formatProgram(program: AST.Program): Doc {
  return formatList(program.content)
}

export function formatList(list: (AST.Block | AST.Content)[]): Doc {
  return concat(
    list.flatMap((item, index) => {
      const isLast = index === list.length - 1
      const lineBreak = !isLast ? [hardline] : []
      const extraLineBreak =
        !isLast && (item.type === 'block' || list[index + 1].type === 'block')
          ? [hardline]
          : []
      const suffix = [...lineBreak, ...extraLineBreak]

      switch (item.type) {
        case 'block':
          return [formatBlock(item), ...suffix]
        case 'content':
          return [formatContent(item), ...suffix]
      }
    })
  )
}

export function formatContent(content: AST.Content): Doc {
  return content.value
}

export function formatBlock(block: AST.Block): Doc {
  return concat([
    block.name,
    ' {',
    block.content.length > 0
      ? concat([
          indent(concat([hardline, formatList(block.content)])),
          hardline,
        ])
      : '',
    '}',
  ])
}
