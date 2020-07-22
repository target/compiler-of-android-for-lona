import { LogicAST as AST, decodeLogic } from '@lona/serialization'
import * as Serialization from '@lona/serialization'
import { createModule, ModuleContext } from '@lona/compiler/lib/logic/module'
import { UUID } from '@lona/compiler/lib/logic/namespace'
import { createLayoutFile } from '../../android/layoutResources'
import { findComponentFunction } from '../component'
import { createLayout } from '../../android/components/createElementTree'
import { findNode } from '@lona/compiler/lib/logic/traversal'
import { createFs } from 'buffs'
import { EvaluationContext } from '@lona/compiler/lib/logic/evaluation'
import { FunctionDeclaration } from '@lona/compiler/lib/logic/nodes/FunctionDeclaration'

function getComponentFunction(module: ModuleContext): FunctionDeclaration {
  const logicFile = module.componentFiles.find(file =>
    file.sourcePath.endsWith('Example.cmp')
  )

  if (!logicFile) {
    throw new Error(`Failed to find Example.cmp`)
  }

  const componentFunction = findComponentFunction(logicFile.rootNode)

  if (!componentFunction) {
    throw new Error(`Component function not found`)
  }

  return componentFunction
}

function moduleWithFile(file: string): ModuleContext {
  const source = createFs({
    'lona.json': JSON.stringify({}),
    'Example.cmp': file,
  })

  return createModule(source, '/')
}

it('creates View layout', () => {
  const file = `
let primary: Color = #color(css: "#FAB")

func Row() -> Element {
  return View(__name: "Container", backgroundColor: primary, width: DimensionSize.fixed(100), height: DimensionSize.fixed(100))
}
`
  const module = moduleWithFile(file)
  const componentFunction = getComponentFunction(module)

  const { layout } = createLayout(
    { evaluationContext: module.evaluationContext },
    componentFunction
  )
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
  const module = moduleWithFile(file)
  const componentFunction = getComponentFunction(module)

  const { layout } = createLayout(
    { evaluationContext: module.evaluationContext },
    componentFunction
  )
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
  const module = moduleWithFile(file)
  const componentFunction = getComponentFunction(module)

  const { layout } = createLayout(
    { evaluationContext: module.evaluationContext },
    componentFunction
  )
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
  const module = moduleWithFile(file)
  const componentFunction = getComponentFunction(module)

  const { layout } = createLayout(
    { evaluationContext: module.evaluationContext },
    componentFunction
  )
  const layoutFile = createLayoutFile(layout)

  expect(layoutFile).toMatchSnapshot()
})
