import {
  LogicAST as AST,
  decodeLogic,
  decodeDocument,
  extractProgramFromAST,
} from '@lona/serialization'
import * as FileSearch from '@lona/compiler/lib/utils/file-search'
import { copy, IFS } from 'buffs'
import path from 'path'
import { Namespace, mergeNamespaces, createNamespace } from './namespace'
import { createScopeContext, Scope, mergeScopes } from './scope'
import { createUnificationContext } from './typeChecker'
import { unify } from './typeUnifier'
import { joinPrograms, makeProgram } from '@lona/compiler/lib/helpers/logic-ast'
import { evaluate, EvaluationContext } from './evaluation'

export function componentFilePaths(workspacePath: string): string[] {
  return FileSearch.sync(workspacePath, '**/*.cmp').map(file =>
    path.join(workspacePath, file)
  )
}

export function logicFilePaths(workspacePath: string): string[] {
  return FileSearch.sync(workspacePath, '**/*.logic').map(file =>
    path.join(workspacePath, file)
  )
}

export function documentFilePaths(workspacePath: string): string[] {
  return FileSearch.sync(workspacePath, '**/*.md').map(file =>
    path.join(workspacePath, file)
  )
}

export function libraryFilePaths(): string[] {
  const libraryPath = path.join(__dirname, 'library')

  return FileSearch.sync(libraryPath, '**/*.logic').map(file =>
    path.join(libraryPath, file)
  )
}

type LogicFile = {
  isLibrary: boolean
  sourcePath: string
  rootNode: AST.TopLevelDeclarations
}

export function decode<T>(
  fs: IFS,
  filePath: string,
  decoder: (data: string) => T
): T {
  const data = fs.readFileSync(filePath, 'utf8')
  const ast = decoder(data)
  return ast
}

type ProgramConfig = {
  componentFiles: LogicFile[]
  evaluationContext?: EvaluationContext
}

export function program(fs: IFS, workspacePath: string): ProgramConfig {
  const componentFiles = componentFilePaths(workspacePath).map(sourcePath => ({
    isLibrary: false,
    sourcePath,
    rootNode: decode(fs, sourcePath, decodeLogic) as AST.TopLevelDeclarations,
  }))

  const files: LogicFile[] = [
    ...libraryFilePaths().map(sourcePath => ({
      isLibrary: true,
      sourcePath,
      rootNode: decode(fs, sourcePath, decodeLogic) as AST.TopLevelDeclarations,
    })),
    ...componentFiles,
    ...documentFilePaths(workspacePath).map(sourcePath => ({
      isLibrary: false,
      sourcePath,
      rootNode: decode(fs, sourcePath, data =>
        extractProgramFromAST(decodeDocument(data))
      ),
    })),
  ]

  const namespace: Namespace = mergeNamespaces(
    files.map(logicFile => createNamespace(logicFile.rootNode))
  )

  const scope: Scope = mergeScopes(
    files.map(logicFile =>
      createScopeContext(logicFile.rootNode, namespace, undefined, console)
    )
  )

  const programNode = joinPrograms(
    files.map(logicFile => makeProgram(logicFile.rootNode))
  )

  const typeChecker = createUnificationContext(programNode, scope, console)

  const substitution = unify(typeChecker.constraints, console)

  const evaluationContext = evaluate(
    programNode,
    scope,
    typeChecker,
    substitution,
    console
  )

  return {
    componentFiles,
    evaluationContext,
  }
}
