import { StaticType } from '../logic/staticType'

export type StyleableAttribute = {
  format: string
  getter: string
}

export function convertParameterTypeAnnotation(logicType: StaticType): string {
  switch (logicType.type) {
    case 'constant': {
      const { name } = logicType

      switch (name) {
        case 'String':
          return 'CharSequence'
      }
    }
  }

  return 'Any'
}

export function convertStyleableAttribute(
  logicType: StaticType
): StyleableAttribute | undefined {
  const typeString = convertParameterTypeAnnotation(logicType)

  switch (typeString) {
    case 'String':
    case 'CharSequence':
      return { format: 'string', getter: 'getString' }
  }
}
