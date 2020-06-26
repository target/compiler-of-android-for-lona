import { LogicAST as AST } from '@lona/serialization'
import { builtInTypeConstructorNames } from '../namespace'
import { IDeclaration } from './interfaces'
import { ScopeVisitor } from '../scope'
import NamespaceVisitor from '../namespaceVisitor'

export function createDeclarationNode(
  syntaxNode: AST.SyntaxNode
): IDeclaration | undefined {
  switch (syntaxNode.type) {
    case 'variable':
      return new VariableDeclaration(syntaxNode)
    case 'record':
      return new RecordDeclaration(syntaxNode)
    case 'enumeration':
      return new EnumerationDeclaration(syntaxNode)
    case 'function':
      return new FunctionDeclaration(syntaxNode)
    case 'namespace':
      return new NamespaceDeclaration(syntaxNode)
    default:
      return undefined
  }
}

export class VariableDeclaration implements IDeclaration {
  syntaxNode: AST.VariableDeclaration

  constructor(syntaxNode: AST.VariableDeclaration) {
    this.syntaxNode = syntaxNode
  }

  namespaceEnter(visitor: NamespaceVisitor): void {}

  namespaceLeave(visitor: NamespaceVisitor): void {
    const {
      name: { name, id },
    } = this.syntaxNode.data

    visitor.declareValue(name, id)
  }

  scopeEnter(visitor: ScopeVisitor): void {}

  scopeLeave(visitor: ScopeVisitor): void {
    const { name } = this.syntaxNode.data

    visitor.addValueToScope(name)
  }
}

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
}

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
}

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
}

export class NamespaceDeclaration implements IDeclaration {
  syntaxNode: AST.NamespaceDeclaration

  constructor(syntaxNode: AST.NamespaceDeclaration) {
    this.syntaxNode = syntaxNode
  }

  namespaceEnter(visitor: NamespaceVisitor): void {
    const {
      name: { name, id },
    } = this.syntaxNode.data

    visitor.pushPathComponent(name)
  }

  namespaceLeave(visitor: NamespaceVisitor): void {
    const {
      name: { name, id },
    } = this.syntaxNode.data

    visitor.popPathComponent()
  }

  scopeEnter(visitor: ScopeVisitor): void {
    const {
      name: { name },
    } = this.syntaxNode.data

    visitor.pushNamespace(name)
  }

  scopeLeave(visitor: ScopeVisitor): void {
    visitor.popNamespace()
  }
}
