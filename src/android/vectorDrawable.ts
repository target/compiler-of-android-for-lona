import { Command, Point } from '@lona/svg-model'

import * as XML from '../xml/ast'
import print from '../xml/print'

export type LineCap = 'butt' | 'round' | 'square'

export type FillType = 'evenOdd' | 'nonZero'

export type Path = {
  pathData: Command[]
  strokeWidth?: number
  fillColor?: string
  strokeColor?: string
  fillType?: FillType // API 24
  strokeLineCap?: LineCap
}

export type Vector = {
  width?: number
  height?: number
  viewportWidth?: number
  viewportHeight?: number
  elements: Path[]
}

/**
 * Round decimal values to reduce file size.
 *
 * For algorithm:
 * https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
 *
 * @param number
 * @param precision
 */
const round = (number: number, precision: number): number => {
  const rounder = Math.pow(10, precision)
  return Math.round((number + Number.EPSILON) * rounder) / rounder
}

const pointString = (point: Point): string => {
  return `${round(point.x, 3)},${round(point.y, 3)}`
}

export const pathString = (commands: Command[]): string => {
  return commands
    .map(command => {
      switch (command.type) {
        case 'close':
          return 'Z'
        case 'move':
          return `M${pointString(command.data.to)}`
        case 'line':
          return `L${pointString(command.data.to)}`
        case 'quadCurve': {
          const parameters = [
            pointString(command.data.controlPoint),
            pointString(command.data.to),
          ]
          return `Q${parameters.join(' ')}`
        }
        case 'cubicCurve': {
          const parameters = [
            pointString(command.data.controlPoint1),
            pointString(command.data.controlPoint2),
            pointString(command.data.to),
          ]
          return `C${parameters.join(' ')}`
        }
      }
    })
    .join('')
}

const pathElement = (path: Path): XML.Element => {
  const attributes: XML.Attribute[] = [
    {
      name: 'android:pathData',
      value: pathString(path.pathData),
    },
  ]

  if (path.fillColor) {
    attributes.push({ name: 'android:fillColor', value: `${path.fillColor}` })
  }

  if (path.fillType) {
    attributes.push({ name: 'android:fillType', value: `${path.fillType}` })
  }

  if (path.strokeWidth) {
    attributes.push({
      name: 'android:strokeWidth',
      value: `${path.strokeWidth}`,
    })
  }

  if (path.strokeColor) {
    attributes.push({
      name: 'android:strokeColor',
      value: `${path.strokeColor}`,
    })
  }

  if (path.strokeLineCap) {
    attributes.push({
      name: 'android:strokeLineCap',
      value: `${path.strokeLineCap}`,
    })
  }

  return {
    tag: 'path',
    attributes: attributes,
    content: [],
  }
}

export const vectorElement = (vector: Vector): XML.Element => {
  const attributes: XML.Attribute[] = [
    {
      name: 'xmlns:android',
      value: 'http://schemas.android.com/apk/res/android',
    },
  ]

  if (vector.width) {
    attributes.push({ name: 'android:width', value: `${vector.width}dp` })
  }

  if (vector.height) {
    attributes.push({ name: 'android:height', value: `${vector.height}dp` })
  }

  if (vector.viewportWidth) {
    attributes.push({
      name: 'android:viewportWidth',
      value: `${vector.viewportWidth}`,
    })
  }

  if (vector.viewportHeight) {
    attributes.push({
      name: 'android:viewportHeight',
      value: `${vector.viewportHeight}`,
    })
  }

  return {
    tag: 'vector',
    attributes: attributes,
    content: vector.elements.map(path => ({
      type: 'element',
      data: pathElement(path),
    })),
  }
}

export const createFile = (vector: Vector): string => {
  const document: XML.Document = {
    prolog: {},
    element: vectorElement(vector),
  }

  return print(document)
}
