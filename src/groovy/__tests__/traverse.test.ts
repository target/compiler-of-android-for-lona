import { findBlockByPath } from '../traverse'
import * as AST from '../ast'

it('finds blocks by path', () => {
  const target: AST.Block = {
    type: 'block',
    name: 'b',
    content: [],
  }

  const program: AST.Program = {
    type: 'program',
    content: [
      {
        type: 'block',
        name: 'a',
        content: [target],
      },
    ],
  }

  const found = findBlockByPath(program, ['a', 'b'])

  expect(found).toBe(target)
})
