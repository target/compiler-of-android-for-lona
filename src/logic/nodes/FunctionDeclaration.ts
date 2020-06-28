import { LogicAST as AST } from '@lona/serialization'
import { IDeclaration } from './interfaces'
import NamespaceVisitor from '../namespaceVisitor'
import { ScopeVisitor } from '../scopeVisitor'
import { TypeCheckerVisitor } from '../typeChecker'
import { nonNullable } from '@lona/compiler/lib/utils/non-nullable'
import { StaticType, FunctionArgument } from '../staticType'
import { evaluateIsTrue } from '../evaluation'
import { EvaluationVisitor } from '../EvaluationVisitor'
import { declarationPathTo } from '@lona/compiler/lib/helpers/logic-ast'
import { Value, StandardLibrary } from '../runtime/value'
import { substitute } from '../typeUnifier'
import { DefaultArguments } from '../runtime/memory'
import { compact } from '../../utils/sequence'

export class FunctionDeclaration implements IDeclaration {
  syntaxNode: AST.FunctionDeclaration

  constructor(syntaxNode: AST.FunctionDeclaration) {
    this.syntaxNode = syntaxNode
  }

  namespaceEnter(visitor: NamespaceVisitor): void {}

  namespaceLeave(visitor: NamespaceVisitor): void {
    const {
      name: { name, id },
    } = this.syntaxNode.data

    visitor.declareValue(name, id)
  }

  scopeEnter(visitor: ScopeVisitor): void {
    const { name, parameters, genericParameters } = this.syntaxNode.data

    visitor.addValueToScope(name)

    visitor.pushScope()

    parameters.forEach(parameter => {
      switch (parameter.type) {
        case 'parameter':
          visitor.addValueToScope(parameter.data.localName)
        case 'placeholder':
          break
      }
    })

    genericParameters.forEach(parameter => {
      switch (parameter.type) {
        case 'parameter':
          visitor.addTypeToScope(parameter.data.name)
        case 'placeholder':
          break
      }
    })
  }

  scopeLeave(visitor: ScopeVisitor): void {
    visitor.popScope()
  }

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {
    const { genericParameters, parameters, name } = this.syntaxNode.data
    const { typeChecker } = visitor

    const genericNames = genericParameters
      .map(param =>
        param.type === 'parameter' ? param.data.name.name : undefined
      )
      .filter(nonNullable)

    const genericsInScope: [string, string][] = genericNames.map(x => [
      x,
      typeChecker.typeNameGenerator.next(),
    ])

    let parameterTypes: FunctionArgument[] = []

    parameters.forEach(param => {
      if (param.type === 'placeholder') return

      const { name, id } = param.data.localName

      let annotationType = visitor.unificationType(
        [],
        () => typeChecker.typeNameGenerator.next(),
        param.data.annotation
      )

      parameterTypes.unshift({ label: name, type: annotationType })

      typeChecker.nodes[id] = annotationType
      typeChecker.patternTypes[id] = annotationType
    })

    let returnType = visitor.unificationType(
      genericsInScope,
      () => typeChecker.typeNameGenerator.next(),
      this.syntaxNode.data.returnType
    )

    let functionType: StaticType = {
      type: 'function',
      returnType,
      arguments: parameterTypes,
    }

    typeChecker.nodes[name.id] = functionType
    typeChecker.patternTypes[name.id] = functionType
  }

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {}

  evaluationEnter(visitor: EvaluationVisitor) {
    const { name, block, parameters } = this.syntaxNode.data
    const { resolveType } = visitor

    const functionType = resolveType(name.id)

    if (!functionType) return

    const defaultArguments: DefaultArguments = Object.fromEntries(
      compact(
        parameters.map((parameter, index) => {
          if (parameter.type !== 'parameter') return

          const parameterType = resolveType(parameter.data.localName.id)

          if (!parameterType) return

          return [
            parameter.data.localName.name,
            [parameterType, StandardLibrary.unit()],
          ]
        })
      )
    )

    visitor.addValue(name.id, {
      type: functionType,
      memory: {
        type: 'function',
        value: {
          defaultArguments,
          f: args => {
            const newContext = visitor.evaluation.copy()

            parameters.forEach((p, i) => {
              if (p.type === 'parameter') {
                newContext.addValue(
                  p.data.localName.id,
                  args[p.data.localName.name] ||
                    defaultArguments[p.data.localName.name][1]
                )
              }
            })

            function evaluateBlock(block: AST.Statement[]): Value | undefined {
              for (let statement of block) {
                switch (statement.type) {
                  case 'branch': {
                    if (evaluateIsTrue(newContext, statement.data.condition)) {
                      const res = evaluateBlock(statement.data.block)
                      if (res) {
                        return res
                      }
                    }
                    break
                  }
                  case 'placeholder':
                  case 'expression':
                  case 'declaration': {
                    break
                  }
                  case 'loop': {
                    while (
                      evaluateIsTrue(newContext, statement.data.expression)
                    ) {
                      const res = evaluateBlock(statement.data.block)
                      if (res) {
                        return res
                      }
                    }
                  }
                  case 'return': {
                    return newContext.evaluate(
                      statement.data.expression.data.id
                    )
                  }
                }
              }
            }

            return evaluateBlock(block)?.memory || StandardLibrary.unit().memory
          },
        },
      },
    })
  }
}
