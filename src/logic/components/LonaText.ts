import { ComponentVisitor } from './ComponentVisitor'
import { Decode } from '@lona/compiler/lib/logic/runtime/value'
import {
  AndroidElement,
  AndroidTextView,
} from '../../android/components/AndroidElement'
import { TextViewOptions } from '../../android/layoutResources'
import { silentReporter } from '@lona/compiler/lib/utils/reporter'
import { LonaView, LonaViewConstructor } from './LonaView'

export class LonaText extends LonaView {
  value?: string

  get textViewOptions(): TextViewOptions {
    return {
      ...this.viewOptions,
      text: this.value,
    }
  }

  get androidElement(): AndroidElement {
    return new AndroidTextView(this.name, this.textViewOptions)
  }

  constructor(node: LonaViewConstructor, visitor: ComponentVisitor) {
    super(node, visitor)

    const { argumentExpressionNodes } = node

    if ('value' in argumentExpressionNodes) {
      const expression = argumentExpressionNodes['value']
      const value = visitor.evaluation.evaluate(expression.id, silentReporter)
      if (value) {
        const text = Decode.string(value)
        if (text) {
          this.value = text
        } else {
          throw new Error('Failed to decode logic string value')
        }
      } else {
        visitor.addViewAttributeAssignment(this.name, 'text', expression)
      }
    }
  }
}
