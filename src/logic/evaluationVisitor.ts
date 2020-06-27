import { Reporter } from '@lona/compiler/lib/helpers/reporter'
import { LogicAST as AST } from '@lona/serialization'
import { Value } from './runtime/value'
import { Scope } from './scope'
import { TypeChecker } from './typeChecker'
import { Substitution } from './typeUnifier'
import { EvaluationContext, Thunk } from './evaluation'

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
