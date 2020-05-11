import { addDependency, addDependencies } from '../buildScript'

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

    expect(addDependency(source, dependency)).toEqual(result)
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

    expect(addDependency(source, dependency)).toEqual(result)
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

    expect(addDependency(source, dependency)).toEqual(result)
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

    expect(addDependency(source, dependency)).toEqual(source)
  })
})
