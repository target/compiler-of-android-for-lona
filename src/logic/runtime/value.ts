import * as StaticType from '../staticType'
import * as Memory from './memory'

export type Value = {
  type: StaticType.StaticType
  memory: Memory.Memory
}

export namespace StandardLibrary {
  export const unit = (): Value => ({
    type: StaticType.unit,
    memory: Memory.unit(),
  })

  export const bool = (value: boolean): Value => ({
    type: StaticType.bool,
    memory: Memory.bool(value),
  })

  export const number = (value: number): Value => ({
    type: StaticType.number,
    memory: Memory.number(value),
  })

  export const string = (value: string): Value => ({
    type: StaticType.string,
    memory: Memory.string(value),
  })

  export const color = (value: string): Value => ({
    type: StaticType.color,
    memory: {
      type: 'record',
      value: {
        value: {
          type: StaticType.string,
          memory: Memory.string(value),
        },
      },
    },
  })

  export const array = (
    elementType: StaticType.StaticType,
    values: Value[]
  ) => ({
    type: elementType,
    memory: Memory.array(values),
  })
}
