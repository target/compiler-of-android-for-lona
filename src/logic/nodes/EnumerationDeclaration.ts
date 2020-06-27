import { LogicAST as AST } from '@lona/serialization'
import { IDeclaration } from './interfaces'
import NamespaceVisitor from '../namespaceVisitor'
import { ScopeVisitor } from '../scopeVisitor'
import { TypeCheckerVisitor } from '../typeChecker'
import { nonNullable } from '@lona/compiler/lib/utils/non-nullable'
import { StaticType } from '../staticType'
import { EvaluationVisitor } from '../EvaluationVisitor'
import { substitute } from '../typeUnifier'
import { Memory, FuncMemory } from '../runtime/memory'
import { StandardLibrary } from '../runtime/value'

export class EnumerationDeclaration implements IDeclaration {
  syntaxNode: AST.EnumerationDeclaration

  constructor(syntaxNode: AST.EnumerationDeclaration) {
    this.syntaxNode = syntaxNode
  }

  namespaceEnter(visitor: NamespaceVisitor): void {
    const {
      name: { name, id },
    } = this.syntaxNode.data

    visitor.declareType(name, id)
    visitor.pushPathComponent(name)
  }

  namespaceLeave(visitor: NamespaceVisitor): void {
    const {
      name: { name, id },
      cases,
    } = (this.syntaxNode as AST.EnumerationDeclaration).data

    // Add initializers for each case into the namespace
    cases.forEach(enumCase => {
      switch (enumCase.type) {
        case 'placeholder':
          break
        case 'enumerationCase':
          visitor.declareValue(enumCase.data.name.name, enumCase.data.name.id)
      }
    })

    visitor.popPathComponent()
  }

  scopeEnter(visitor: ScopeVisitor): void {
    const { name, genericParameters } = this.syntaxNode.data

    visitor.addTypeToScope(name)

    visitor.pushNamespace(name.name)

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
    visitor.popNamespace()
  }

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {
    const { genericParameters, cases, name } = this.syntaxNode.data
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

    const universalTypes = genericNames.map<StaticType>((x, i) => ({
      type: 'generic',
      name: genericsInScope[i][1],
    }))

    const returnType: StaticType = {
      type: 'constant',
      name: name.name,
      parameters: universalTypes,
    }

    cases.forEach(enumCase => {
      if (enumCase.type === 'placeholder') {
        return
      }

      const parameterTypes = enumCase.data.associatedValueTypes
        .map(annotation => {
          if (annotation.type === 'placeholder') return

          return {
            label: undefined,
            type: visitor.unificationType(
              genericsInScope,
              () => typeChecker.typeNameGenerator.next(),
              annotation
            ),
          }
        })
        .filter(nonNullable)

      const functionType: StaticType = {
        type: 'function',
        returnType,
        arguments: parameterTypes,
      }

      typeChecker.nodes[enumCase.data.name.id] = functionType
      typeChecker.patternTypes[enumCase.data.name.id] = functionType
    })

    /* Not used for unification, but used for convenience in evaluation */
    typeChecker.nodes[name.id] = returnType
    typeChecker.patternTypes[name.id] = returnType
  }

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {}

  evaluationEnter(visitor: EvaluationVisitor) {
    const { name, cases } = this.syntaxNode.data
    const { typeChecker, substitution, reporter } = visitor

    const type = typeChecker.patternTypes[name.id]

    if (!type) {
      reporter.error('unknown enumberation type')
      return
    }

    cases.forEach(enumCase => {
      if (enumCase.type !== 'enumerationCase') return

      const resolvedConsType = substitute(substitution, type)
      const { name } = enumCase.data

      visitor.addValue(name.id, {
        type: resolvedConsType,
        memory: {
          type: 'function',
          value: (...args) => {
            return {
              type: 'enum',
              value: name.name,
              data: args,
            }
          },
        },
      })
    })
  }
}
