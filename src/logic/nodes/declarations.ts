import { LogicAST as AST } from '@lona/serialization'
import { NamespaceVisitor, builtInTypeConstructorNames } from '../namespace'
import { IDeclaration } from './interfaces'

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
}
