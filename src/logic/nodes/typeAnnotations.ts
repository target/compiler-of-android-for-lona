import { LogicAST as AST } from '@lona/serialization'
import { NamespaceVisitor, builtInTypeConstructorNames } from '../namespace'
import { IDeclaration, ITypeAnnotation } from './interfaces'
import { ScopeVisitor } from '../scope'

export function createTypeAnnotationNode(
  syntaxNode: AST.SyntaxNode
): ITypeAnnotation | undefined {
  switch (syntaxNode.type) {
    case 'typeIdentifier':
      return new IdentifierTypeAnnotation(syntaxNode)
    case 'functionType':
      return new FunctionTypeAnnotation(syntaxNode)
    default:
      return undefined
  }
}

export class IdentifierTypeAnnotation implements ITypeAnnotation {
  syntaxNode: AST.TypeIdentifierTypeAnnotation

  constructor(syntaxNode: AST.TypeIdentifierTypeAnnotation) {
    this.syntaxNode = syntaxNode
  }

  scopeEnter(visitor: ScopeVisitor): void {
    const { genericArguments } = this.syntaxNode.data

    genericArguments.forEach(arg => {
      visitor.traverse(arg)
    })

    visitor.traversalConfig.ignoreChildren = true
    // visitor.traversalConfig.needsRevisitAfterTraversingChildren = false
  }

  scopeLeave(visitor: ScopeVisitor): void {
    const { id, identifier } = this.syntaxNode.data

    if (identifier.isPlaceholder) return

    const found = visitor.findTypeIdentifierReference(identifier.string)

    if (found) {
      visitor.scope.typeIdentifierToPattern[id] = found
    } else {
      visitor.reporter.warn(
        `No type identifier: ${identifier.string}`,
        visitor.scope.valueNames
      )
      visitor.scope.undefinedTypeIdentifiers.add(id)
    }
  }
}

export class FunctionTypeAnnotation implements ITypeAnnotation {
  syntaxNode: AST.FunctionTypeTypeAnnotation

  constructor(syntaxNode: AST.FunctionTypeTypeAnnotation) {
    this.syntaxNode = syntaxNode
  }

  scopeEnter(visitor: ScopeVisitor): void {
    visitor.traversalConfig.ignoreChildren = true
    visitor.traversalConfig.needsRevisitAfterTraversingChildren = false
  }

  scopeLeave(visitor: ScopeVisitor): void {}
}
