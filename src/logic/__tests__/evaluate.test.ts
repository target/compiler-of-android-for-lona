import { AST } from '@lona/compiler/lib/helpers/logic-ast'
import * as Serialization from '@lona/serialization'
import { silentReporter } from '../../reporter'
import { EvaluationContext } from '../evaluate'
import { generate } from '../evaluationContext'
import { UUID } from '../namespace'
import { findNode } from '../syntaxNode'

function getInitializerId(
  rootNode: AST.SyntaxNode,
  variableName: string
): UUID {
  const variable = findNode(rootNode, node => {
    return node.type === 'variable' && node.data.name.name === variableName
  }) as AST.VariableDeclaration | undefined

  if (!variable) {
    throw new Error(`Variable ${variableName} not found`)
  }

  const initializer = variable.data.initializer

  if (!initializer) {
    throw new Error(`Initializer for ${variableName} not found`)
  }

  return initializer.data.id
}

function standardEvaluate(rootNode: AST.SyntaxNode): EvaluationContext {
  const evaluation = generate(console, [rootNode])

  if (!evaluation) {
    throw new Error('Failed to evaluate')
  }

  return evaluation
}

describe('Logic / Evaluate', () => {
  it('evaluates number literals', () => {
    const file = `let x: Number = 4`
    const rootNode = Serialization.decodeLogic(file)
    const initializerId = getInitializerId(rootNode, 'x')
    const evaluation = standardEvaluate(rootNode)

    expect(evaluation.evaluate(initializerId)).toEqual({
      type: { type: 'constant', name: 'Number', parameters: [] },
      memory: { type: 'number', value: 4 },
    })
  })

  it('evaluates number literals', () => {
    const file = `
enum Foo {
  case bar()
}

let x: Foo = Foo.bar()
    `
    const rootNode = Serialization.decodeLogic(file)
    const initializerId = getInitializerId(rootNode, 'x')
    const evaluation = standardEvaluate(rootNode)

    expect(evaluation.evaluate(initializerId)).toEqual({
      type: { type: 'constant', name: 'Foo', parameters: [] },
      memory: { type: 'enum', value: 'bar', data: [] },
    })
  })

  it('evaluates DimensionSize', () => {
    const file = `
let x: DimensionSize = DimensionSize.fixed(100)
`
    const rootNode = Serialization.decodeLogic(file)
    const initializerId = getInitializerId(rootNode, 'x')
    const evaluation = standardEvaluate(rootNode)

    expect(evaluation.evaluate(initializerId)).toMatchSnapshot()
  })

  it('evaluates custom function', () => {
    const file = `
func test() -> DimensionSize {
  return DimensionSize.fixed(100)
}

let x: DimensionSize = test()
`
    const rootNode = Serialization.decodeLogic(file)
    const initializerId = getInitializerId(rootNode, 'x')
    const evaluation = standardEvaluate(rootNode)

    const result = evaluation.evaluate(initializerId)

    expect(result).toMatchSnapshot()
  })

  //   it('evaluates View function', () => {
  //     const file = `
  // let x: Element = View()
  // `
  //     const rootNode = Serialization.decodeLogic(file)
  //     const initializerId = getInitializerId(rootNode, 'x')
  //     const evaluation = standardEvaluate(rootNode)

  //     const result = evaluation.evaluate(initializerId)

  //     expect(result).toEqual({})
  //   })
})
