import path from 'path'
import {
  printElement,
  parse,
  removeWhitespace,
  mergeElementsByTagName,
  MERGE_ATTRIBUTES_CHOOSE_SOURCE,
} from '../xml'

/**
 * Returns true if the given path is a manifest or manifest template file
 *
 * @param filepath Path to file
 */
export function isManifestPath(filepath: string): boolean {
  return path.basename(filepath, '.ftl') === 'AndroidManifest.xml'
}

export function mergeManifests(
  sourceXmlString: string,
  targetXmlString: string
): string {
  const source = removeWhitespace(parse(sourceXmlString))
  const target = removeWhitespace(parse(targetXmlString))

  const merged = mergeElementsByTagName(
    source,
    target,
    MERGE_ATTRIBUTES_CHOOSE_SOURCE
  )

  return printElement(merged)
}
