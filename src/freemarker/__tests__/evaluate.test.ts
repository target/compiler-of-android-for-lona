import { parse, evaluate, ProgramNode } from '../index'
import { Context } from '../context'
import {
  evaluateLiteral,
  evaluateIdentifier,
  evaluateUnaryExpression,
  evaluateCallExpression,
  evaluateLogicalExpression,
  evaluateBinaryExpression,
} from '../evaluate/expression'
import ParamNames from 'freemarker-parser/dist/enum/ParamNames'

describe('Freemarker / Evaluate', () => {
  describe('Node', () => {
    it('evaluates a condition', () => {
      const template = '<#if x>yes</#if>'
      const ast = parse(template).ast as ProgramNode

      expect(evaluate(ast, new Context({ x: true }))).toEqual('yes')
      expect(evaluate(ast, new Context({ x: false }))).toEqual('')
    })

    it('evaluates an interpolation node', () => {
      const template = '${x}'
      const ast = parse(template).ast as ProgramNode

      expect(evaluate(ast, new Context({ x: 'hello' }))).toEqual('hello')
    })

    it('evaluates a list node', () => {
      const template = '<#list x as element>${element}</#list>'
      const ast = parse(template).ast as ProgramNode

      expect(evaluate(ast, new Context({ x: ['a', 'b', 'c'] }))).toEqual('abc')
    })
  })

  describe('Expression', () => {
    it('evaluates a literal', () => {
      const result = evaluateLiteral(
        { type: ParamNames.Literal, raw: '42', value: 42 },
        new Context({})
      )

      expect(result).toEqual(42)
    })

    it('evaluates an identifier', () => {
      const result = evaluateIdentifier(
        { type: ParamNames.Identifier, name: 'foo' },
        new Context({ foo: 42 })
      )

      expect(result).toEqual(42)
    })

    it('evaluates a ! unary expression', () => {
      const result = evaluateUnaryExpression(
        {
          type: ParamNames.UnaryExpression,
          operator: '!',
          prefix: true,
          argument: {
            type: ParamNames.Identifier,
            name: 'foo',
          },
        },
        new Context({ foo: true })
      )

      expect(result).toEqual(false)
    })

    it('evaluates a ?? unary expression', () => {
      const result = evaluateUnaryExpression(
        {
          type: ParamNames.UnaryExpression,
          operator: '??',
          prefix: false,
          argument: {
            type: ParamNames.Identifier,
            name: 'foo',
          },
        },
        new Context({ foo: 42 })
      )

      expect(result).toEqual(true)
    })

    it('evaluates a call expression', () => {
      const result = evaluateCallExpression(
        {
          type: ParamNames.CallExpression,
          callee: {
            type: ParamNames.Identifier,
            name: 'func',
          },
          arguments: [
            {
              type: ParamNames.Identifier,
              name: 'foo',
            },
          ],
        },
        new Context({
          foo: 42,
          func: (value: any): any => value * 2,
        })
      )

      expect(result).toEqual(42 * 2)
    })

    it('evaluates a logical expression', () => {
      const result = evaluateLogicalExpression(
        {
          type: ParamNames.LogicalExpression,
          operator: '||',
          left: {
            type: ParamNames.Identifier,
            name: 'foo',
          },
          right: {
            type: ParamNames.Identifier,
            name: 'bar',
          },
        },
        new Context({
          foo: false,
          bar: true,
        })
      )

      expect(result).toEqual(true)
    })

    it('evaluates a > logical expression', () => {
      const result = evaluateBinaryExpression(
        {
          type: ParamNames.BinaryExpression,
          operator: '>',
          left: {
            type: ParamNames.Identifier,
            name: 'foo',
          },
          right: {
            type: ParamNames.Identifier,
            name: 'bar',
          },
        },
        new Context({
          foo: 42,
          bar: -42,
        })
      )

      expect(result).toEqual(true)
    })

    it('evaluates a < logical expression', () => {
      const result = evaluateBinaryExpression(
        {
          type: ParamNames.BinaryExpression,
          operator: '<',
          left: {
            type: ParamNames.Identifier,
            name: 'foo',
          },
          right: {
            type: ParamNames.Identifier,
            name: 'bar',
          },
        },
        new Context({
          foo: 42,
          bar: -42,
        })
      )

      expect(result).toEqual(false)
    })
  })
})
