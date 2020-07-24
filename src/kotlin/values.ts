import { Value, Decode } from '@lona/compiler/lib/logic/runtime/value'

export function convertValue(logicValue: Value): string {
  switch (logicValue.type.type) {
    case 'constructor': {
      const { name } = logicValue.type

      switch (name) {
        case 'String': {
          const kotlinValue = Decode.string(logicValue)

          if (typeof kotlinValue === 'undefined') break

          return JSON.stringify(kotlinValue)
        }
      }
    }
  }

  console.log('Failed to convert value', logicValue)

  return 'null'
}
