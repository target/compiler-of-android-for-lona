import { declarationPathTo } from '@lona/compiler/lib/helpers/logic-ast'
import { Reporter } from '@lona/compiler/lib/helpers/reporter'
import { assertNever } from '@lona/compiler/lib/utils/assert-never'
import { nonNullable } from '@lona/compiler/lib/utils/non-nullable'
import { ShallowMap } from '@lona/compiler/lib/utils/shallow-map'
import { LogicAST as AST } from '@lona/serialization'
import { Value, StandardLibrary } from './runtime/value'
import { Scope } from './scope'
import * as StaticType from './staticType'
import { TypeChecker } from './typeChecker'
import { substitute, Substitution } from './typeUnifier'
import { createNode, createEvaluationVisitor } from './nodes/createNode'

const STANDARD_LIBRARY = 'standard library'

export function evaluateIsTrue(
  context: EvaluationContext,
  expression: AST.Expression
) {
  const condition = context.evaluate(expression.data.id)
  return (
    (condition &&
      condition.type.type === 'constant' &&
      condition.type.name === 'Boolean' &&
      condition.memory.type === 'bool' &&
      condition.memory.value) ||
    false
  )
}

type Thunk = {
  label: string
  dependencies: string[]
  f: (args: Value[]) => Value
}

export class EvaluationVisitor {
  evaluation: EvaluationContext
  rootNode: AST.SyntaxNode
  scope: Scope
  reporter: Reporter
  typeChecker: TypeChecker
  substitution: Substitution

  constructor(
    rootNode: AST.SyntaxNode,
    scope: Scope,
    typeChecker: TypeChecker,
    substitution: Substitution,
    reporter: Reporter
  ) {
    this.evaluation = new EvaluationContext(reporter)
    this.rootNode = rootNode
    this.scope = scope
    this.reporter = reporter
    this.typeChecker = typeChecker
    this.substitution = substitution
  }

  add(uuid: string, thunk: Thunk) {
    this.evaluation.add(uuid, thunk)
  }

  addValue(uuid: string, value: Value) {
    this.evaluation.addValue(uuid, value)
  }
}

/**
 * The evaluation context of the Lona Workspace.
 */
export class EvaluationContext {
  values: { [uuid: string]: Value } = {}
  thunks: { [uuid: string]: Thunk } = {}
  reporter?: Reporter

  constructor(reporter?: Reporter) {
    this.reporter = reporter
  }

  add(uuid: string, thunk: Thunk) {
    this.thunks[uuid] = thunk
  }

  addValue(uuid: string, value: Value) {
    this.values[uuid] = value
  }

  /**
   * Evaluate the id to a value, resolving any dependency along the way
   */
  evaluate(uuid: string): Value | undefined {
    const value = this.values[uuid]

    if (value) return value

    const thunk = this.thunks[uuid]

    if (!thunk) {
      this.reporter?.error(`no thunk for ${uuid}`)
      return undefined
    }

    const resolvedDependencies = thunk.dependencies.map(x => this.evaluate(x))

    if (resolvedDependencies.some(x => !x)) {
      this.reporter?.error(
        `Failed to evaluate thunk ${uuid} (${thunk.label}) - missing dep ${
          thunk.dependencies[resolvedDependencies.findIndex(x => !x)]
        }`
      )
      return undefined
    }

    const result = thunk.f(resolvedDependencies as Value[])
    this.values[uuid] = result

    return result
  }

  copy() {
    const newContext = new EvaluationContext(this.reporter)
    newContext.thunks = { ...this.thunks }
    newContext.values = { ...this.values }
    return newContext
  }
}

export const evaluate = (
  node: AST.SyntaxNode,
  visitor: EvaluationVisitor
): EvaluationContext | undefined => {
  const {
    rootNode,
    scope,
    typeChecker,
    substitution,
    reporter,
    evaluation: initialContext,
  } = visitor

  // TODO: Handle stopping
  const context = AST.subNodes(node).reduce<EvaluationContext | undefined>(
    (prev, subNode) => {
      if (!prev) {
        return undefined
      }
      return evaluate(subNode, visitor)
    },
    initialContext
  )

  if (!context) {
    return undefined
  }

  switch (node.type) {
    case 'identifierExpression':
    case 'none':
    case 'boolean':
    case 'number':
    case 'string':
    case 'color':
    case 'array':
    case 'literalExpression':
    case 'memberExpression':
    case 'record':
    case 'variable':
    case 'enumeration':
    case 'function':
    case 'functionCallExpression':
      const visitorNode = createEvaluationVisitor(node)

      if (visitorNode) {
        visitorNode.evaluationEnter(visitor)
      }

      break
    case 'assignmentExpression': {
      visitor.add(node.data.left.data.id, {
        label:
          'Assignment for ' +
          declarationPathTo(rootNode, node.data.left.data.id).join('.'),
        dependencies: [node.data.right.data.id],
        f: values => values[0],
      })
      break
    }
    case 'functionType':
    case 'typeIdentifier':
    case 'program':
    case 'parameter':
    case 'value':
    case 'topLevelParameters':
    case 'topLevelDeclarations':
    case 'enumerationCase': // handled in 'enumeration'
    case 'argument': // handled in 'functionCallExpression'
    case 'namespace':
    case 'importDeclaration':
    case 'placeholder':
    case 'return': // handled in 'function'
    case 'loop': // handled in 'function'
    case 'branch': // handled in 'function'
    case 'expression':
    case 'declaration': {
      break
    }
    default: {
      assertNever(node)
    }
  }

  return context
}
