import { LogicAST as AST } from '@lona/serialization'
import { ITypeAnnotation } from './interfaces'
import { ScopeVisitor } from '../scopeVisitor'

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
