import { AST } from '@lona/compiler/lib/helpers/logic-ast'
import * as Serialization from '@lona/serialization'
import { createLayout, findComponentFunction } from '../component'
import { run } from '../environment'
import { EvaluationContext } from '../evaluation'
import {
  createLayoutFile,
  createConstraintLayout,
} from '../../android/layoutResources'

function standardEvaluate(rootNode: AST.SyntaxNode): EvaluationContext {
  const evaluation = run(console, [rootNode])

  if (!evaluation) {
    throw new Error('Failed to evaluate')
  }

  return evaluation
}

it('creates View layout', () => {
  const file = `
let primary: Color = #color(css: "#FAB")

func Row() -> Element {
  return View(__name: "Container", backgroundColor: primary, width: DimensionSize.fixed(100), height: DimensionSize.fixed(100))
}
`
  const rootNode = Serialization.decodeLogic(file)
  const evaluationContext = standardEvaluate(rootNode)
  const componentFunction = findComponentFunction(rootNode)

  expect(componentFunction).toBeDefined()
  expect(evaluationContext).toBeDefined()

  if (!componentFunction || !evaluationContext) return

  const { layout } = createLayout({ evaluationContext }, componentFunction)
  const layoutFile = createLayoutFile(layout)

  expect(layoutFile).toMatchSnapshot()
})

it('creates View with children layout', () => {
  const file = `
let primary: Color = #color(css: "#FAB")

func Row() -> Element {
  return View(__name: "Container", children: [
    View(__name: "Child1"),
    View(__name: "Child2")
  ])
}
`
  const rootNode = Serialization.decodeLogic(file)
  const evaluationContext = standardEvaluate(rootNode)
  const componentFunction = findComponentFunction(rootNode)

  expect(componentFunction).toBeDefined()
  expect(evaluationContext).toBeDefined()

  if (!componentFunction || !evaluationContext) return

  const { layout } = createLayout({ evaluationContext }, componentFunction)
  const layoutFile = createLayoutFile(layout)

  expect(layoutFile).toMatchSnapshot()
})

it('creates Text layout', () => {
  const file = `
let primary: Color = #color(css: "#FAB")

func Row() -> Element {
  return View(children: [
    Text(value: "Hello")
  ])
}
`
  const rootNode = Serialization.decodeLogic(file)
  const evaluationContext = standardEvaluate(rootNode)
  const componentFunction = findComponentFunction(rootNode)

  expect(componentFunction).toBeDefined()
  expect(evaluationContext).toBeDefined()

  if (!componentFunction || !evaluationContext) return

  const { layout } = createLayout({ evaluationContext }, componentFunction)
  const layoutFile = createLayoutFile(layout)

  expect(layoutFile).toMatchSnapshot()
})

it('creates HorizontalStack layout', () => {
  const file = `
let primary: Color = #color(css: "#FAB")

func Row() -> Element {
  return HorizontalStack(__name: "Container", children: [
    View(),
    View(),
    View()
  ])
}
`
  const rootNode = Serialization.decodeLogic(file)
  const evaluationContext = standardEvaluate(rootNode)
  const componentFunction = findComponentFunction(rootNode)

  expect(componentFunction).toBeDefined()
  expect(evaluationContext).toBeDefined()

  if (!componentFunction || !evaluationContext) return

  const { layout } = createLayout({ evaluationContext }, componentFunction)
  const layoutFile = createLayoutFile(layout)

  expect(layoutFile).toMatchSnapshot()
})
