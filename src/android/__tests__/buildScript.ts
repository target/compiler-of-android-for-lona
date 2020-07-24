import { addLine, addDependencies } from '../buildScript'

describe('Android / BuildScript', () => {
  test('adds a dependency to a buildscript block', () => {
    const dependency = `classpath 'foo'`

    const source = `buildscript {
    repositories {
        google()
        jcenter()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:3.6.0+'

        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
}`

    const result = `buildscript {
    repositories {
        google()
        jcenter()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:3.6.0+'
        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
        classpath 'foo'
    }
}`

    expect(
      addLine(source, ['buildscript', 'dependencies'], dependency)
    ).toEqual(result)
  })

  test('adds a dependency to the last dependencies block', () => {
    const dependency = `classpath 'foo'`

    const source = `buildscript {
    repositories {
        google()
        jcenter()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:3.6.0+'
    }
}

dependencies {

}`

    const result = `buildscript {
    repositories {
        google()
        jcenter()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:3.6.0+'
    }
}

dependencies {
    classpath 'foo'
}`

    expect(addLine(source, ['dependencies'], dependency)).toEqual(result)
  })

  test('adds a dependency', () => {
    const dependency = `classpath 'foo'`

    const source = `dependencies {
    implementation 'a'
    implementation 'b'
}`
    const result = `dependencies {
    implementation 'a'
    implementation 'b'
    ${dependency}
}`

    expect(addLine(source, ['dependencies'], dependency)).toEqual(result)
  })

  test('adds multiple dependency', () => {
    const dependency1 = `classpath 'foo'`
    const dependency2 = `implementation 'c'`
    const dependency3 = `implementation 'd'`

    const source = `dependencies {
    implementation 'a'
    implementation 'b'
}`
    const result = `dependencies {
    implementation 'a'
    implementation 'b'
    ${dependency1}
    ${dependency2}
    ${dependency3}
}`

    expect(
      addDependencies(source, [dependency1, dependency2, dependency3])
    ).toEqual(result)
  })

  test('does not duplicate a dependency', () => {
    const dependency = `classpath 'foo'`

    const source = `dependencies {
    implementation 'a'
    implementation 'b'
    ${dependency}
}`

    expect(addLine(source, ['dependencies'], dependency)).toEqual(source)
  })

  test('adds a line to an arbitrary block', () => {
    const line = `viewBinding.enabled = true`

    const source = `android {
    compileSdkVersion 29
    buildToolsVersion "29"
}`

    const result = `android {
    compileSdkVersion 29
    buildToolsVersion "29"
    ${line}
}`

    expect(addLine(source, ['android'], line)).toEqual(result)
  })
})
