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

  const layout = createLayout({ evaluationContext }, componentFunction)
  const layoutFile = createLayoutFile(createConstraintLayout([layout]))

  expect(layoutFile).toMatchSnapshot()
})
