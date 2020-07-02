import * as FileSearch from '@lona/compiler/lib/utils/file-search'
import { IFS } from 'buffs'
import path from 'path'
import { isMatch } from 'micromatch'

export function search(
  source: IFS,
  searchPath: string,
  pattern: string,
  options: { ignore?: string[] } = {}
): string[] {
  let found: string[] = []

  const { root } = path.parse(searchPath)

  function glob(currentPath: string) {
    const { ignore = [] } = options

    const scannablePath =
      currentPath === root ? currentPath : path.relative(root, currentPath)

    const shouldIgnore = ignore.some(ignorePattern =>
      isMatch(scannablePath, ignorePattern)
    )

    if (shouldIgnore) return

    if (isMatch(scannablePath, pattern)) {
      found.push(path.relative(searchPath, currentPath))
    }

    const stat = source.lstatSync(currentPath)

    if (stat.isDirectory()) {
      const files = source.readdirSync(currentPath)

      files.forEach(file => {
        glob(path.join(currentPath, file))
      })
    }
  }

  glob(searchPath)

  return found
}

export function componentFilePaths(fs: IFS, workspacePath: string): string[] {
  return search(fs, workspacePath, '**/*.cmp').map(file =>
    path.join(workspacePath, file)
  )
}

export function logicFilePaths(fs: IFS, workspacePath: string): string[] {
  return search(fs, workspacePath, '**/*.logic').map(file =>
    path.join(workspacePath, file)
  )
}

export function documentFilePaths(fs: IFS, workspacePath: string): string[] {
  return search(fs, workspacePath, '**/*.md').map(file =>
    path.join(workspacePath, file)
  )
}

export function libraryFilePaths(): string[] {
  const libraryPath = path.join(__dirname, 'library')

  return FileSearch.sync(libraryPath, '**/*.logic').map(file =>
    path.join(libraryPath, file)
  )
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
