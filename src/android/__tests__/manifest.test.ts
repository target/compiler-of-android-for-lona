import { mergeManifests } from '../manifest'

describe('Android / Manifest', () => {
  test('merges application elements', () => {
    const source = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android" >
  <application>
    <service android:name="foo">
    </service>
  </application>
</manifest>
`
    const target = `
<manifest xmlns:android="http://schemas.android.com/apk/res/android" >
  <application>
    <activity android:name=".MyActivity">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
  </application>
</manifest>
`

    const result = `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application>
    <service android:name="foo" />
    <activity android:name=".MyActivity">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
  </application>
</manifest>`

    expect(mergeManifests(source, target)).toEqual(result)
  })
})
