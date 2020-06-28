import * as XML from '../xml/ast'
import print from '../xml/print'
import { compact } from '../utils/sequence'

export const createConstraintLayout = (
  children: XML.Element[]
): XML.Element => {
  return {
    tag: 'androidx.constraintlayout.widget.ConstraintLayout',
    attributes: [
      {
        name: 'xmlns:android',
        value: 'http://schemas.android.com/apk/res/android',
      },
      { name: 'xmlns:app', value: 'http://schemas.android.com/apk/res-auto' },
      { name: 'xmlns:tools', value: 'http://schemas.android.com/tools' },
      { name: 'android:layout_width', value: 'match_parent' },
      { name: 'android:layout_height', value: 'match_parent' },
    ],
    content: children.map(item => ({ type: 'element', data: item })),
  }
}

export type ViewOptions = {
  layoutWidth?: string
  layoutHeight?: string
  background?: string
}

export type TextViewOptions = ViewOptions & {
  text?: string
}

function convertViewOptions({
  layoutWidth,
  layoutHeight,
  background,
}: ViewOptions): XML.Attribute[] {
  return compact<XML.Attribute>([
    typeof layoutWidth === 'string' && {
      name: 'android:layout_width',
      value: layoutWidth,
    },
    typeof layoutHeight === 'string' && {
      name: 'android:layout_height',
      value: layoutHeight,
    },
    typeof background === 'string' && {
      name: 'android:background',
      value: background,
    },
    { name: 'app:layout_constraintTop_toTopOf', value: 'parent' },
    { name: 'app:layout_constraintLeft_toLeftOf', value: 'parent' },
  ])
}

function convertTextViewOptions({
  text,
  ...rest
}: TextViewOptions): XML.Attribute[] {
  return [
    ...convertViewOptions(rest),
    ...compact<XML.Attribute>([
      typeof text === 'string' && {
        name: 'android:text',
        value: text,
      },
    ]),
  ]
}

export const createView = (
  options: ViewOptions = {},
  children: XML.Element[] = []
): XML.Element => {
  return {
    tag: 'View',
    attributes: convertViewOptions(options),
    content: children.map(item => ({ type: 'element', data: item })),
  }
}

export const createTextView = (options: TextViewOptions = {}): XML.Element => {
  return {
    tag: 'TextView',
    attributes: convertTextViewOptions(options),
    content: [],
  }
}

/**
 * Create a resource XML file using the following format:
 *
 * <?xml version="1.0" encoding="utf-8"?>
 * <resources>
 *   ...
 * </resources>
 */
export const createLayoutFile = (element: XML.Element): string => {
  const document: XML.Document = {
    prolog: {
      xmlDecl: {
        version: '1.0',
        encoding: 'utf-8',
      },
    },
    element,
  }

  return print(document)
}
