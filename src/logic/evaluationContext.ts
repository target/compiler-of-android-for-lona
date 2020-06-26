import * as fs from 'fs'
import * as path from 'path'
import { LogicAST as AST, decodeLogic } from '@lona/serialization'
import * as LogicScope from './scope'
import * as LogicUnify from './typeUnifier'
import * as LogicEvaluate from './evaluate'
import { Reporter } from '@lona/compiler/lib/helpers/reporter'
import { nonNullable } from '@lona/compiler/lib/utils/non-nullable'
import { makeProgram, joinPrograms } from '@lona/compiler/lib/helpers/logic-ast'
import { createNamespace } from './namespace'
import { makeUnificationContext } from './typeChecker'

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
  const scopeContext = LogicScope.createScopeContext(programNode, namespace)

  const unificationContext = makeUnificationContext(
    programNode,
    scopeContext,
    reporter
  )
  const substitution = LogicUnify.unify(
    unificationContext.constraints,
    reporter
  )

  const evaluationContext = LogicEvaluate.evaluate(
    programNode,
    programNode,
    scopeContext,
    unificationContext,
    substitution,
    reporter
  )

  return evaluationContext
}
