import snakeCase from 'lodash.snakecase'

function createImportStatement(packagePath: string) {
  return `import ${packagePath}`
}

function createLazyViewBinding(viewName: string, typeName: string) {
  return `open val ${viewName}View: ${typeName} by lazy { binding.${viewName} }`
}

function createParameterVariable(
  variableName: string,
  typeName: string,
  defaultValue: string
) {
  return `open var ${variableName}: ${typeName} = ${defaultValue}
  set(value) {
    field = value
    update()
  }`
}

function createParameterInitializer(
  variableName: string,
  getter: string,
  className: string
) {
  const attrName = `${className}_${snakeCase(variableName)}`
  return `${variableName} = typedAttributes.${getter}(R.styleable.${attrName}) ?: ${variableName}`
}

function indent(
  string: string,
  count: number,
  { prefix = '', suffix = '' }: { prefix?: string; suffix?: string } = {}
): string {
  if (!string) return ''

  return (
    prefix +
    string
      .split('\n')
      .map(line => ' '.repeat(count) + line)
      .join('\n') +
    suffix
  )
}

function createConstraintLayoutSubclass({
  className,
  bindingName,
  packagePath,
  importsRegion,
  privateRegion,
  publicRegion,
  initializeFromAttributesRegion,
}: {
  className: string
  bindingName: string
  packagePath: string
  importsRegion: string
  privateRegion: string
  publicRegion: string
  initializeFromAttributesRegion: string
}) {
  const source = `package ${packagePath}

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import androidx.constraintlayout.widget.ConstraintLayout
import ${packagePath}.databinding.${bindingName}
${importsRegion}

open class ${className} : ConstraintLayout {

    //region Private

    private lateinit var binding: ${bindingName}
${indent(privateRegion, 4, { prefix: '\n', suffix: '\n' })}
    //endregion

    //region Public
${indent(publicRegion, 4, { prefix: '\n', suffix: '\n' })}
    //endregion

    //region Lifecycle

    constructor(context: Context) : super(context) {
        initialize(context, null)
    }

    constructor(context: Context, attrs: AttributeSet) : super(context, attrs) {
        initialize(context, attrs)
    }

    constructor(context: Context, attrs: AttributeSet, defStyleAttr: Int) : super(
        context,
        attrs,
        defStyleAttr
    ) {
        initialize(context, attrs)
    }

    private fun initialize(context: Context, attrs: AttributeSet?) {
        binding = ${bindingName}.inflate(LayoutInflater.from(context), this, true)

        attrs?.let {
            val typedAttributes = context.obtainStyledAttributes(it, R.styleable.${className})
${indent(initializeFromAttributesRegion, 12, { prefix: '\n' })}
        }
    }

    private fun update() {}

    //endregion
}
`

  return source
}

type Parameter = {
  name: string
  type: string
  defaultValue: string
  attributeGetter?: string
}

type PublicView = {
  name: string
  type: string
}

export function createComponentClass({
  namePrefix,
  packagePath,
  imports,
  parameters,
  publicViews,
}: {
  namePrefix: string
  packagePath: string
  imports: string[]
  parameters: Parameter[]
  publicViews: PublicView[]
}): string {
  const className = `${namePrefix}View`
  const bindingName = `${namePrefix}Binding`

  return createConstraintLayoutSubclass({
    className,
    bindingName,
    packagePath,
    importsRegion: imports
      .map(importPath => createImportStatement(importPath))
      .join('\n'),
    privateRegion: parameters
      .map(({ name, type, defaultValue }) =>
        createParameterVariable(name, type, defaultValue)
      )
      .join('\n\n'),
    publicRegion: publicViews
      .map(publicView =>
        createLazyViewBinding(publicView.name, publicView.type)
      )
      .join('\n\n'),
    initializeFromAttributesRegion: parameters
      .filter(({ attributeGetter }) => !!attributeGetter)
      .map(({ name, attributeGetter }) =>
        createParameterInitializer(name, attributeGetter!, `${namePrefix}View`)
      )
      .join('\n\n'),
  })
}
