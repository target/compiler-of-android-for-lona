import * as Serialization from '@lona/serialization'
import * as FileSearch from '@lona/compiler/lib/utils/file-search'
import { copy, IFS } from 'buffs'
import path from 'path'

export function componentFiles(workspacePath: string): string[] {
  return FileSearch.sync(workspacePath, '**/*.cmp').map(file =>
    path.join(workspacePath, file)
  )
}

export function logicFiles(workspacePath: string): string[] {
  return FileSearch.sync(workspacePath, '**/*.logic').map(file =>
    path.join(workspacePath, file)
  )
}

export function documentFiles(workspacePath: string): string[] {
  return FileSearch.sync(workspacePath, '**/*.md').map(file =>
    path.join(workspacePath, file)
  )
}

export function libraryFiles(): string[] {
  const libraryPath = path.join(__dirname, 'library')

  return FileSearch.sync(libraryPath, '**/*.logic').map(file =>
    path.join(libraryPath, file)
  )
}

type LogicFile = {
  isLibrary: boolean
  sourcePath: string
  rootNode: Serialization.LogicAST.TopLevelDeclarations
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

export function program(fs: IFS, workspacePath: string): any {
  const files: LogicFile[] = [
    ...libraryFiles().map(sourcePath => ({
      isLibrary: true,
      sourcePath,
      rootNode: decode(
        fs,
        sourcePath,
        Serialization.decodeLogic
      ) as Serialization.LogicAST.TopLevelDeclarations,
    })),
    ...componentFiles(workspacePath).map(sourcePath => ({
      isLibrary: false,
      sourcePath,
      rootNode: decode(
        fs,
        sourcePath,
        Serialization.decodeLogic
      ) as Serialization.LogicAST.TopLevelDeclarations,
    })),
    ...documentFiles(workspacePath).map(sourcePath => ({
      isLibrary: false,
      sourcePath,
      rootNode: decode(fs, sourcePath, data =>
        Serialization.extractProgramFromAST(Serialization.decodeDocument(data))
      ),
    })),
  ]

  console.log(files)
}
