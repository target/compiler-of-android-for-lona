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

type FileTuple = [string, Serialization.LogicAST.SyntaxNode]

export function program(fs: IFS, workspacePath: string): any {
  function decode<T>(
    filePath: string,
    decoder: (data: string) => T
  ): [string, T] {
    const data = fs.readFileSync(filePath, 'utf8')
    const ast = decoder(data)
    return [filePath, ast]
  }

  const files: FileTuple[] = [
    ...libraryFiles().map(filePath =>
      decode(filePath, Serialization.decodeLogic)
    ),
    ...componentFiles(workspacePath).map(filePath =>
      decode(filePath, Serialization.decodeLogic)
    ),
    ...documentFiles(workspacePath).map(filePath =>
      decode(filePath, data =>
        Serialization.extractProgramFromAST(Serialization.decodeDocument(data))
      )
    ),
  ]

  console.log(files)
}
