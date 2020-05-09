import {
  printElement,
  parse,
  removeWhitespace,
  mergeElementsByTagName,
  MERGE_ATTRIBUTES_CHOOSE_SOURCE,
} from '../xml'

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
