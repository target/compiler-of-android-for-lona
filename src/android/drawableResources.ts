import path from 'path'
import { inflate, Context } from '../freemarker'

export const DEFAULT_DRAWABLE_NAME_TEMPLATE = '${qualifiedName?join("_")}'
export const INVALID_FILE_RESOURCE_CHAR_RE = /[^a-z0-9_]/g

export type Options = {
  nameTemplate: string
}

function formatQualifiedName(qualifiedName: string[], options: Options) {
  return inflate(options.nameTemplate, new Context({ qualifiedName }))
}

/**
 * Flatten a file path into a single snake_case filename
 *
 * Note: File-based resource names must contain only lowercase a-z, 0-9, or underscore
 */
export const formatDrawableName = (
  relativePath: string,
  extname: string = '',
  options: Options
): string => {
  const originalExtname = path.extname(relativePath)
  const pathWithoutExt = path.join(
    path.dirname(relativePath),
    path.basename(relativePath, originalExtname)
  )
  const qualifiedName = pathWithoutExt.split('/')

  const formattedName = formatQualifiedName(qualifiedName, options)

  // Make sure the drawable name is safe
  const safeName = formattedName
    .replace(/-/g, '_')
    .toLowerCase()
    .replace(INVALID_FILE_RESOURCE_CHAR_RE, '')

  if (safeName === '') {
    throw new Error(
      `Formatted drawable name for ${relativePath} is an empty string`
    )
  }

  return safeName + (extname ? `.${extname}` : '')
}
