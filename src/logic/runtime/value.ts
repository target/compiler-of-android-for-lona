import * as LogicUnify from '../unify'
import * as Memory from './memory'

export type Value = {
  type: LogicUnify.Unification
  memory: Memory.Memory
}

export const unit = (): Value => ({
  type: LogicUnify.unit,
  memory: Memory.unit(),
})

export const bool = (value: boolean): Value => ({
  type: LogicUnify.bool,
  memory: Memory.bool(value),
})

export const number = (value: number): Value => ({
  type: LogicUnify.number,
  memory: Memory.number(value),
})

export const string = (value: string): Value => ({
  type: LogicUnify.string,
  memory: Memory.string(value),
})
