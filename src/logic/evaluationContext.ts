import * as fs from 'fs'
import * as path from 'path'
import { LogicAST as AST, decodeLogic } from '@lona/serialization'
import { unify } from './typeUnifier'
import * as LogicEvaluate from './evaluate'
import { Reporter } from '@lona/compiler/lib/helpers/reporter'
import { nonNullable } from '@lona/compiler/lib/utils/non-nullable'
import { makeProgram, joinPrograms } from '@lona/compiler/lib/helpers/logic-ast'
import { createNamespace } from './namespace'
import { createUnificationContext } from './typeChecker'
import { createScopeContext } from './scope'

export const STANDARD_LIBRARY = 'standard library'

export const generate = (reporter: Reporter, programs: AST.SyntaxNode[]) => {
  const standardLibsPath = path.join(__dirname, 'library')
  const standardLibs = fs.readdirSync(standardLibsPath)

  const libraryFiles: AST.Program[] = standardLibs.map(
    x =>
      makeProgram(
        decodeLogic(fs.readFileSync(path.join(standardLibsPath, x), 'utf8'))
      ) as AST.Program
  )

  const standardLibsProgram = joinPrograms(libraryFiles)
  const logicPrograms = programs.map(makeProgram).filter(nonNullable)
  const programNode = joinPrograms([standardLibsProgram, ...logicPrograms])

  const namespace = createNamespace(programNode)
  const scope = createScopeContext(programNode, namespace)
  const typeChecker = createUnificationContext(programNode, scope, reporter)
  const substitution = unify(typeChecker.constraints, reporter)

  const evaluationContext = LogicEvaluate.evaluate(
    programNode,
    new LogicEvaluate.EvaluationVisitor(
      programNode,
      scope,
      typeChecker,
      substitution,
      reporter
    )
  )

  return evaluationContext
}
