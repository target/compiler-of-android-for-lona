import { Reporter } from '@lona/compiler/lib/helpers/reporter'
import { LogicAST as AST } from '@lona/serialization'
import { Value } from './runtime/value'
import { Scope } from './scope'
import { TypeChecker } from './typeChecker'
import { Substitution, substitute } from './typeUnifier'
import { EvaluationContext, Thunk } from './evaluation'
import { UUID } from './namespace'
import { StaticType } from './staticType'

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

  add(uuid: UUID, thunk: Thunk) {
    this.evaluation.add(uuid, thunk)
  }

  addValue(uuid: UUID, value: Value) {
    this.evaluation.addValue(uuid, value)
  }

  resolveType = (uuid: UUID): StaticType | undefined => {
    const { typeChecker, substitution, reporter } = this

    let type = typeChecker.nodes[uuid]

    if (!type) {
      reporter.error(`Unknown type ${uuid}`)
      return
    }

    return substitute(substitution, type)
  }
}
