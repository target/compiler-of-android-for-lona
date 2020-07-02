import { search } from '../files'
import { createFs } from 'buffs'

it('searches files', () => {
  const { fs } = createFs({
    a: '',
  })

  const result = search(fs, '/', 'a')

  expect(result).toEqual(['a'])
})

it('searches nested files', () => {
  const { fs } = createFs({
    'a/b/c': '',
  })

  const result = search(fs, '/', '**/c')

  expect(result).toEqual(['a/b/c'])
})

it('ignores files', () => {
  const { fs } = createFs({
    'a/b/c': '',
  })

  const result = search(fs, '/', '**/c', { ignore: ['**/b'] })

  expect(result).toEqual([])
})

it('searches multiple files', () => {
  const { fs } = createFs({
    'a.js': '',
    'b/c.js': '',
  })

  const result = search(fs, '/', '*.js')

  expect(result).toEqual(['a.js'])
})

it('searches multiple nested files', () => {
  const { fs } = createFs({
    'a/b.js': '',
    'a/b/c.js': '',
  })

  const result = search(fs, '/a', '**/*.js')

  expect(result).toEqual(['b/c.js', 'b.js'])
})
