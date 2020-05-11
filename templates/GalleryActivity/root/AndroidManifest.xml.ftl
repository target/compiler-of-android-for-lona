<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application>
        <activity
            android:name=".GalleryActivity"
            android:label="@string/title_activity_gallery"
            android:theme="@style/AppTheme.NoActionBar"
            android:launchMode="singleTop">

            <meta-data android:name="android.app.searchable"
                android:resource="@xml/searchable" />

            <intent-filter>
                <action android:name="android.intent.action.SEARCH" />
            </intent-filter>
        </activity>
    </application>

</manifest>