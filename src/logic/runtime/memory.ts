import * as LogicUnify from '../unify'
import { Value } from './value'

export type Memory =
  | { type: 'unit' }
  | { type: 'bool'; value: boolean }
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'array'; value: Value[] }
  | { type: 'enum'; value: string; data: Value[] }
  | { type: 'record'; value: { [key: string]: Value } }
  | {
      type: 'function'
      value:
        | {
            type: 'path'
            value: string[]
            evaluate: (...args: Value[]) => Value | undefined
          }
        | {
            type: 'recordInit'
            value: { [key: string]: [LogicUnify.Unification, Value | void] }
          }
        | { type: 'enumInit'; value: string }
    }

export const unit = (): Memory => ({ type: 'unit' })

export const bool = (value: boolean): Memory => ({ type: 'bool', value })

export const number = (value: number): Memory => ({ type: 'number', value })

export const string = (value: string): Memory => ({ type: 'string', value })
