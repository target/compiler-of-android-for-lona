import path from 'path'
import util from 'util'
import { IFS } from 'buffs'
import * as XML from '../xml'
import { Context, inflateFile } from '../freemarker'

import { Config, getConfig } from './config'
import { parse as parseRecipe, Recipe } from './recipe'
import { parse as parseGlobals, Globals } from './globals'
import { execute } from './execute'

function readXML(source: IFS, filePath: string): XML.Element {
  const templateString = source.readFileSync(filePath, 'utf8')
  return XML.parse(templateString)
}

/**
 * Read a template config file (template.xml)
 */
function readConfig(source: IFS, templatePath: string): Config {
  const templateElement = readXML(source, templatePath)
  return getConfig(templateElement)
}

/**
 * Read a recipe file (recipe.xml)
 */
function readRecipe(source: IFS, recipePath: string, context: Context): Recipe {
  const inflated = inflateFile(source, recipePath, context)
  const xml = XML.parse(inflated)
  return parseRecipe(xml)
}

/**
 * Read a globals file (globals.xml.ftl)
 */
function readGlobals(
  source: IFS,
  globalsPath: string,
  context: Context
): Globals {
  const inflated = inflateFile(source, globalsPath, context)
  const xml = XML.parse(inflated)
  return parseGlobals(xml)
}

export type InflateOptions = {
  verbose?: boolean
}

/**
 * Generate an Android project or module template
 *
 * @param source The source filesystem
 * @param sourcePath The template directory path (the directory that contains template.xml)
 * @param targetPath The path to generate template
 * @param initialContext The initial freemarker context, before reading template globals
 * @param inflateOptions Options
 */
export function inflate(
  source: IFS,
  sourcePath: string,
  targetPath: string,
  initialContext: Context,
  inflateOptions: InflateOptions = {}
): { files: IFS; context: Context } {
  const { verbose = false } = inflateOptions

  const templatePath = path.join(sourcePath, 'template.xml')

  if (verbose) {
    console.warn('INFO: Inflating template at', templatePath)
  }

  const template = readConfig(source, templatePath)

  const { globals: globalsName, execute: recipeName } = template

  const globalsPath = path.join(sourcePath, globalsName)

  if (verbose) {
    console.warn('INFO: Reading globals at', globalsPath)
  }

  const globals = readGlobals(source, globalsPath, initialContext)

  if (verbose) {
    console.warn('INFO: Globals:')
    console.warn(util.inspect(globals, false, null, true))
  }

  const recipePath = path.join(sourcePath, recipeName)

  const sharedContext = initialContext.withDefaults(globals)

  if (verbose) {
    console.warn('INFO: Reading recipe at', recipePath)
  }

  const recipe = readRecipe(source, recipePath, sharedContext)

  if (verbose) {
    console.warn('INFO: Recipe:')
    console.warn(util.inspect(recipe, false, null, true))
  }

  const target = execute(source, sourcePath, targetPath, recipe, sharedContext)

  return { files: target, context: sharedContext }
}
