import { LogicAST as AST } from '@lona/serialization'
import { builtInTypeConstructorNames } from '../namespace'
import { IDeclaration } from './interfaces'
import NamespaceVisitor from '../namespaceVisitor'
import { ScopeVisitor } from '../scopeVisitor'
import { TypeCheckerVisitor } from '../typeChecker'
import { nonNullable } from '@lona/compiler/lib/utils/non-nullable'
import { StaticType, FunctionArgument } from '../staticType'
import { EvaluationVisitor } from '../EvaluationVisitor'
import { Value } from '../runtime/value'
import { substitute } from '@lona/compiler/lib/helpers/logic-unify'

export class RecordDeclaration implements IDeclaration {
  syntaxNode: AST.RecordDeclaration

  constructor(syntaxNode: AST.RecordDeclaration) {
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
    } = this.syntaxNode.data

    visitor.popPathComponent()

    // Built-ins should be constructed using literals
    if (builtInTypeConstructorNames.has(name)) return

    // Create constructor function
    visitor.declareValue(name, id)
  }

  scopeEnter(visitor: ScopeVisitor): void {
    const { name, declarations, genericParameters } = this.syntaxNode.data

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

    // Handle variable initializers manually
    declarations.forEach(declaration => {
      switch (declaration.type) {
        case 'variable': {
          const { name: variableName, initializer } = declaration.data

          if (!initializer) break

          visitor.traverse(initializer)

          visitor.addValueToScope(variableName)
        }
        default:
          break
      }
    })

    // Don't introduce variables names into scope
    visitor.traversalConfig.ignoreChildren = true
  }

  scopeLeave(visitor: ScopeVisitor): void {
    visitor.popNamespace()
  }

  typeCheckerEnter(visitor: TypeCheckerVisitor): void {
    const { genericParameters, declarations, name } = this.syntaxNode.data
    const { typeChecker } = visitor

    const genericNames = genericParameters
      .map(param =>
        param.type === 'parameter' ? param.data.name.name : undefined
      )
      .filter(nonNullable)

    const genericsInScope = genericNames.map(x => [
      x,
      typeChecker.typeNameGenerator.next(),
    ])

    const universalTypes = genericNames.map<StaticType>((x, i) => ({
      type: 'generic',
      name: genericsInScope[i][1],
    }))

    let parameterTypes: FunctionArgument[] = []

    declarations.forEach(declaration => {
      if (declaration.type !== 'variable' || !declaration.data.annotation) {
        return
      }
      const { annotation, name } = declaration.data
      const annotationType = visitor.unificationType(
        [],
        () => typeChecker.typeNameGenerator.next(),
        annotation
      )
      parameterTypes.unshift({
        label: name.name,
        type: annotationType,
      })

      typeChecker.nodes[name.id] = annotationType
      typeChecker.patternTypes[name.id] = annotationType
    })

    const returnType: StaticType = {
      type: 'constant',
      name: name.name,
      parameters: universalTypes,
    }

    const functionType: StaticType = {
      type: 'function',
      returnType,
      arguments: parameterTypes,
    }

    typeChecker.nodes[name.id] = functionType
    typeChecker.patternTypes[name.id] = functionType
  }

  typeCheckerLeave(visitor: TypeCheckerVisitor): void {}

  evaluationEnter(visitor: EvaluationVisitor) {
    const { name, declarations } = this.syntaxNode.data
    const { typeChecker, substitution, reporter } = visitor

    const type = typeChecker.patternTypes[name.id]

    if (!type) {
      reporter.error('Unknown record type')
      return
    }

    const resolvedType = substitute(substitution, type)
    const dependencies = declarations
      .map(x =>
        x.type === 'variable' && x.data.initializer
          ? x.data.initializer.data.id
          : undefined
      )
      .filter(nonNullable)

    visitor.add(name.id, {
      label: 'Record declaration for ' + name.name,
      dependencies,
      f: values => {
        const parameterTypes: {
          [key: string]: [StaticType, Value | void]
        } = {}
        let index = 0

        declarations.forEach(declaration => {
          if (declaration.type !== 'variable') {
            return
          }
          const parameterType =
            typeChecker.patternTypes[declaration.data.name.id]
          if (!parameterType) {
            return
          }

          let initialValue: Value | void
          if (declaration.data.initializer) {
            initialValue = values[index]
            index += 1
          }

          parameterTypes[declaration.data.name.name] = [
            parameterType,
            initialValue,
          ]
        })

        return {
          type: resolvedType,
          memory: {
            type: 'function',
            value: {
              type: 'recordInit',
              value: parameterTypes,
            },
          },
        }
      },
    })
  }
}
