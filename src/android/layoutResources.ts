import * as XML from '../xml/ast'
import print from '../xml/print'
import { compact } from '../utils/sequence'

export type ViewOptions = {
  id?: string
  layoutWidth?: string
  layoutHeight?: string
  background?: string
  constraintStartToStartOf?: string
  constraintStartToEndOf?: string
  constraintEndToStartOf?: string
  constraintEndToEndOf?: string
  constraintTopToTopOf?: string
  constraintTopToBottomOf?: string
  constraintBottomToTopOf?: string
  constraintBottomToBottomOf?: string
}

export type TextViewOptions = ViewOptions & {
  text?: string
}

function convertViewOptions({
  id,
  layoutWidth,
  layoutHeight,
  background,
  constraintStartToStartOf,
  constraintStartToEndOf,
  constraintEndToStartOf,
  constraintEndToEndOf,
  constraintTopToTopOf,
  constraintTopToBottomOf,
  constraintBottomToTopOf,
  constraintBottomToBottomOf,
}: ViewOptions): XML.Attribute[] {
  return compact<XML.Attribute>([
    typeof id === 'string' && {
      name: 'android:id',
      value: id,
    },
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
    typeof constraintStartToStartOf === 'string' && {
      name: 'app:layout_constraintStart_toStartOf',
      value: constraintStartToStartOf,
    },
    typeof constraintStartToEndOf === 'string' && {
      name: 'app:layout_constraintStart_toEndOf',
      value: constraintStartToEndOf,
    },
    typeof constraintEndToStartOf === 'string' && {
      name: 'app:layout_constraintEnd_toStartOf',
      value: constraintEndToStartOf,
    },
    typeof constraintEndToEndOf === 'string' && {
      name: 'app:layout_constraintEnd_toEndOf',
      value: constraintEndToEndOf,
    },
    typeof constraintTopToTopOf === 'string' && {
      name: 'app:layout_constraintTop_toTopOf',
      value: constraintTopToTopOf,
    },
    typeof constraintTopToBottomOf === 'string' && {
      name: 'app:layout_constraintTop_toBottomOf',
      value: constraintTopToBottomOf,
    },
    typeof constraintBottomToTopOf === 'string' && {
      name: 'app:layout_constraintBottom_toTopOf',
      value: constraintBottomToTopOf,
    },
    typeof constraintBottomToBottomOf === 'string' && {
      name: 'app:layout_constraintBottom_toBottomOf',
      value: constraintBottomToBottomOf,
    },
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

export const createConstraintLayout = (
  options: ViewOptions = {},
  children: XML.Element[] = []
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
      ...convertViewOptions(options),
    ],
    content: children.map(item => ({ type: 'element', data: item })),
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
