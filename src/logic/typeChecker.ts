import * as LogicTraversal from '@lona/compiler/lib/helpers/logic-traversal'
import { Reporter } from '@lona/compiler/lib/helpers/reporter'
import { assertNever } from '@lona/compiler/lib/utils/assert-never'
import { ShallowMap } from '@lona/compiler/lib/utils/shallow-map'
import { LogicAST as AST } from '@lona/serialization'
import { createTypeCheckerVisitor } from './nodes/createNode'
import { Scope } from './scope'
import { bool, color, number, StaticType, string, unit } from './staticType'
import { forEach } from './syntaxNode'
import { Constraint, substitute } from './typeUnifier'

class LogicNameGenerator {
  private prefix: string
  private currentIndex = 0
  constructor(prefix: string = '') {
    this.prefix = prefix
  }
  next() {
    this.currentIndex += 1
    let name = this.currentIndex.toString(36)
    return `${this.prefix}${name}`
  }
}

export type TypeChecker = {
  constraints: Constraint[]
  nodes: { [key: string]: StaticType }
  patternTypes: { [key: string]: StaticType }
  typeNameGenerator: LogicNameGenerator
}

const makeEmptyContext = (): TypeChecker => ({
  constraints: [],
  nodes: {},
  patternTypes: {},
  typeNameGenerator: new LogicNameGenerator('?'),
})

export class TypeCheckerVisitor {
  typeChecker: TypeChecker = makeEmptyContext()
  scope: Scope
  reporter: Reporter
  traversalConfig = LogicTraversal.emptyConfig()

  constructor(scope: Scope, reporter: Reporter) {
    this.scope = scope
    this.reporter = reporter
  }

  specificIdentifierType(
    scope: Scope,
    unificationContext: TypeChecker,
    id: string
  ): StaticType {
    const patternId = scope.expressionToPattern[id]

    if (!patternId) {
      return {
        type: 'variable',
        value: unificationContext.typeNameGenerator.next(),
      }
    }

    const scopedType = unificationContext.patternTypes[patternId]

    if (!scopedType) {
      return {
        type: 'variable',
        value: unificationContext.typeNameGenerator.next(),
      }
    }

    return this.replaceGenericsWithVars(
      () => unificationContext.typeNameGenerator.next(),
      scopedType
    )
  }

  unificationType(
    genericsInScope: [string, string][],
    getName: () => string,
    typeAnnotation: AST.TypeAnnotation
  ): StaticType {
    if (typeAnnotation.type === 'typeIdentifier') {
      const { string, isPlaceholder } = typeAnnotation.data.identifier
      if (isPlaceholder) {
        return {
          type: 'variable',
          value: getName(),
        }
      }
      const generic = genericsInScope.find(g => g[0] === string)
      if (generic) {
        return {
          type: 'generic',
          name: generic[1],
        }
      }
      const parameters = typeAnnotation.data.genericArguments.map(arg =>
        this.unificationType(genericsInScope, getName, arg)
      )
      return {
        type: 'constant',
        name: string,
        parameters,
      }
    }
    if (typeAnnotation.type === 'placeholder') {
      return {
        type: 'variable',
        value: getName(),
      }
    }
    return {
      type: 'variable',
      value: 'Function type error',
    }
  }

  genericNames = (type: StaticType): string[] => {
    if (type.type === 'variable') {
      return []
    }
    if (type.type === 'constant') {
      return type.parameters
        .map(this.genericNames)
        .reduce((prev, x) => prev.concat(x), [])
    }
    if (type.type === 'generic') {
      return [type.name]
    }
    if (type.type === 'function') {
      return type.arguments
        .map(x => x.type)
        .concat(type.returnType)
        .map(this.genericNames)
        .reduce((prev, x) => prev.concat(x), [])
    }
    assertNever(type)
  }

  replaceGenericsWithVars(getName: () => string, type: StaticType) {
    let substitution = new ShallowMap<StaticType, StaticType>()

    this.genericNames(type).forEach(name =>
      substitution.set(
        { type: 'generic', name },
        { type: 'variable', value: getName() }
      )
    )

    return substitute(substitution, type)
  }
}

const build = (
  node: AST.SyntaxNode,
  visitor: TypeCheckerVisitor
): TypeChecker => {
  const { typeChecker, traversalConfig, scope } = visitor

  traversalConfig.needsRevisitAfterTraversingChildren = true

  switch (node.type) {
    case 'record':
    case 'variable':
    case 'enumeration':
    case 'function':
    case 'identifierExpression':
    case 'memberExpression':
    case 'functionCallExpression':
      const visitorNode = createTypeCheckerVisitor(node)

      if (visitorNode) {
        if (traversalConfig._isRevisit) {
          visitorNode.typeCheckerLeave(visitor)
        } else {
          visitorNode.typeCheckerEnter(visitor)
        }
        return typeChecker
      }

      break
    case 'branch': {
      if (!traversalConfig._isRevisit) {
        // the condition needs to be a Boolean
        typeChecker.nodes[node.data.condition.data.id] = bool
      }
      break
    }
    case 'loop': {
      if (!traversalConfig._isRevisit) {
        // the condition needs to be a Boolean
        typeChecker.nodes[node.data.expression.data.id] = bool
      }
      break
    }
    case 'placeholder': {
      // Using 'placeholder' here may cause problems, since
      // placeholder is ambiguous in our LogicAST TS types
      if (traversalConfig._isRevisit) {
        typeChecker.nodes[node.data.id] = {
          type: 'variable',
          value: typeChecker.typeNameGenerator.next(),
        }
      }
      break
    }
    case 'literalExpression': {
      if (traversalConfig._isRevisit) {
        typeChecker.nodes[node.data.id] =
          typeChecker.nodes[node.data.literal.data.id]
      }
      break
    }
    case 'none': {
      if (traversalConfig._isRevisit) {
        typeChecker.nodes[node.data.id] = unit
      }
      break
    }
    case 'boolean': {
      if (traversalConfig._isRevisit) {
        typeChecker.nodes[node.data.id] = bool
      }
      break
    }
    case 'number': {
      if (traversalConfig._isRevisit) {
        typeChecker.nodes[node.data.id] = number
      }
      break
    }
    case 'string': {
      if (traversalConfig._isRevisit) {
        typeChecker.nodes[node.data.id] = string
      }
      break
    }
    case 'color': {
      if (traversalConfig._isRevisit) {
        typeChecker.nodes[node.data.id] = color
      }
      break
    }
    case 'array': {
      if (traversalConfig._isRevisit) {
        const elementType: StaticType = {
          type: 'variable',
          value: typeChecker.typeNameGenerator.next(),
        }
        typeChecker.nodes[node.data.id] = {
          type: 'constant',
          name: 'Array',
          parameters: [elementType],
        }

        const constraints = node.data.value.map(expression => ({
          head: elementType,
          tail: typeChecker.nodes[expression.data.id] || {
            type: 'variable',
            value: typeChecker.typeNameGenerator.next(),
          },
          origin: node,
        }))

        typeChecker.constraints = typeChecker.constraints.concat(constraints)
      }
      break
    }
    case 'return': {
      // already handled in the revisit of the function declaration
      break
    }
    case 'parameter': {
      // already handled in the function call
      break
    }
    case 'functionType':
    case 'typeIdentifier':
    case 'declaration':
    case 'importDeclaration':
    case 'namespace':
    case 'assignmentExpression':
    case 'program':
    case 'enumerationCase':
    case 'value':
    case 'topLevelDeclarations':
    case 'topLevelParameters':
    case 'argument':
    case 'expression': {
      break
    }
    default: {
      assertNever(node)
    }
  }

  return typeChecker
}

export const makeUnificationContext = (
  rootNode: AST.SyntaxNode,
  scope: Scope,
  reporter: Reporter
): TypeChecker => {
  const visitor = new TypeCheckerVisitor(scope, reporter)

  forEach(rootNode, visitor.traversalConfig, node => {
    build(node, visitor)
  })

  return visitor.typeChecker
}
