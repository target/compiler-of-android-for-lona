import { ComponentVisitor } from './ComponentVisitor'
import {
  AndroidElement,
  AndroidView,
} from '../../android/components/AndroidElement'
import {
  LonaView,
  LonaStackOrientation,
  createAndroidIdReference,
  LonaViewConstructor,
} from './LonaView'

export class LonaStack extends LonaView {
  orientation: LonaStackOrientation

  get androidElement(): AndroidElement {
    const children = this.children.map(child => child.androidElement)

    const isHorizontal = this.orientation === 'HorizontalStack'

    const primaryStartToStartConstraint = isHorizontal
      ? 'constraintStartToStartOf'
      : 'constraintTopToTopOf'
    const primaryStartToEndConstraint = isHorizontal
      ? 'constraintStartToEndOf'
      : 'constraintTopToBottomOf'
    const primaryEndToStartConstraint = isHorizontal
      ? 'constraintEndToStartOf'
      : 'constraintBottomToTopOf'
    const primaryEndToEndConstraint = isHorizontal
      ? 'constraintEndToEndOf'
      : 'constraintBottomToBottomOf'
    const primaryLayoutDimension = isHorizontal ? 'layoutWidth' : 'layoutHeight'
    const secondaryStartToStartConstraint = isHorizontal
      ? 'constraintTopToTopOf'
      : 'constraintStartToStartOf'
    const secondaryEndToEndConstraint = isHorizontal
      ? 'constraintBottomToBottomOf'
      : 'constraintEndToEndOf'
    const secondaryLayoutDimension = isHorizontal
      ? 'layoutHeight'
      : 'layoutWidth'

    // Start constraint
    children.forEach((child, index) => {
      if (index === 0) {
        child.options[primaryStartToStartConstraint] = 'parent'
      } else {
        child.options[primaryStartToEndConstraint] = createAndroidIdReference(
          children[index - 1].id
        )
      }
    })

    // End constraint
    children.forEach((child, index, list) => {
      if (index < list.length - 1) {
        child.options[primaryEndToStartConstraint] = createAndroidIdReference(
          children[index + 1].id
        )
      } else {
        child.options[primaryEndToEndConstraint] = 'parent'
      }
    })

    // Primary axis
    children.forEach(child => {
      if (!child.options[primaryLayoutDimension]) {
        child.options[primaryLayoutDimension] = '0dp'
      }
    })

    // Secondary axis
    children.forEach(child => {
      child.options[secondaryStartToStartConstraint] = 'parent'

      if (!child.options[secondaryLayoutDimension]) {
        child.options[secondaryEndToEndConstraint] = 'parent'
        child.options[secondaryLayoutDimension] = 'match_parent'
      }
    })

    return new AndroidView(this.name, this.viewOptions, children)
  }

  constructor(node: LonaViewConstructor, visitor: ComponentVisitor) {
    super(node, visitor)

    const { callee } = node

    this.orientation =
      callee.name === 'HorizontalStack' ? 'HorizontalStack' : 'VerticalStack'
  }
}
