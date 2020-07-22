import { FunctionParameter } from '@lona/compiler/lib/logic/nodes/FunctionParameter'
import { ModuleContext } from '@lona/compiler/lib/logic/module'
import { convertValue } from './values'
import {
  convertParameterTypeAnnotation,
  convertStyleableAttribute,
  StyleableAttribute,
} from './types'

export type ComponentParameter = {
  name: string
  type: string
  defaultValue: string
  styleableAttribute?: StyleableAttribute
}

export function convertComponentParameter(
  context: ModuleContext,
  parameter: FunctionParameter
): ComponentParameter {
  const { evaluationContext, typeChecker, substitution } = context

  let defaultValue: string = 'null'

  if (parameter.defaultValue.expression) {
    let evaluated = evaluationContext!.evaluate(
      parameter.defaultValue.expression.id
    )

    if (!evaluated) {
      throw new Error('Failed to evaluate default parameter value')
    }

    defaultValue = convertValue(evaluated)
  }

  const staticType = parameter.getType(typeChecker, substitution)

  return {
    name: parameter.name,
    type: convertParameterTypeAnnotation(staticType),
    defaultValue,
    styleableAttribute: convertStyleableAttribute(staticType),
  }
}
