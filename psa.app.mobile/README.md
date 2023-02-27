# psa.app.mobile

PIA Mobile App for iOS and Android.

## Development

### Local / Browser

Install dependencies:

- `npm install`

Run local development server

- `npm run start:browser`

### Device / Emulator

To run the app on a device or an emulator you need to install the following packages globally:

- `npm install -g native-run`
- `npm install -g cordova`
- `npm install -g @ionic/cli`

After installing additional dependencies (see below) you can start the app by running
`start:<plattform>:<emulator|device>`.

- You can choose a device if you add ` -- --target <ID>`
- You can get a list of supported devices by adding ` -- --list`

#### Keycloak login and hot reload

Make sure to add the external IP and port to the allowed redirects and origins of your local `pia-proband-mobile-app-client`,
or you will not be able to log in, due to CORS and redirect restrictions.

The external IP and port is shown, when you start the app.

#### iOS

For building the iOS app you will need a Mac with Xcode installed. To install XCode execute:

- `xcode-select --install`

Additional setup is required for Cordova to support programmatic builds:

- `npm install -g ios-sim`
- `brew install ios-deploy`
- `sudo gem install cocoapods`

Run the app with live reload:

- Emulator: `npm run start:ios:emulator`
- Device: `npm run start:ios:device`

Debug in Safari:

- open Safari
- enable developer options in Safari settings
- click on Developer
- search for the emulator or device and click on the app

Further reading: https://ionicframework.com/docs/developing/ios

#### Android

For building the Android app you will need the Android SDK, Java JDK **8** and the Gradle build tool.

Please Note: cordova-android and therefore psa.app.mobile does currently NOT support Android SDK >= 31
(see: <https://github.com/apache/cordova-android/issues/1288>). If you have Android SDK >= 31 (and the corresponding
Build Tools) installed on your machine, you won't be able to build the PIA Android app. Please install Android SDK 30.

In order to use livereload you need to allow cleartext traffic to your computer's local IP:

- Open `/resources/android/xml/network_security_config.xml`
- Add this `<domain includeSubdomains="true"><!-- YOUR IP HERE --></domain>` within domain-config
- You must not add a protocol or port, only the pure IP
- Do not commit these changes to git!

Run the app with live reload:

- Emulator: `npm run start:android:emulator`
- Device: `npm run start:android:device`

Debug in Chrome:

- open `chrome://inspect#devices`
- search for the emulator or device and click "inspect"

Further reading: https://ionicframework.com/docs/developing/android

## Deployment

### Create New Release

- raise package version in `package.json`
- raise app version in `config.xml`

### App Variants

We currently publish Apps for the Play-Store and Apple-Store with different app identifiers:

- Android App ID: android-packageName="de.pia.app"
- iOS App ID: ios-CFBundleIdentifier="de.info-pia.app"

### Build Release

#### Ionic AppFlow

- An Android or iOS build can be triggered via Gitlab CI
- Ionic will execute `npm run build` to build the webapp for an Android or iOS release

#### Local

Apps should always be built by Ionic AppFlow. Use the following steps only if that does not work.

##### Android

- `npm run build:android` will build the APK file (Android SDK needed - see above)
- You need jarsigner from JDK in your PATH, zipalign installed and the keystore (use keystore from confluence! app updates won't work otherwise)
- `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk alias_name`
- `zipalign -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk PIA.apk`

##### iOS

###### Prerequisites in Apple Dev Console (Select none Enterprise HZI Team)

- App ID with "de.info-pia.app" package name and push notification permission (XCode generated that, but manual should be possible too)
- Apple Distribution Certificate (in dev console AND priv key on Macbook) (see https://support.magplus.com/hc/en-us/articles/203808748-iOS-Creating-a-Distribution-Certificate-and-p12-File)
- or in short: create certificate signing request on mac, upload to dev console, create certificate, download to mac and add to key chain
- Provisioning Profile of type "App Store" connected to above certificate and APP ID ("Pia_App_Store")
- Apple Push Notification Key in dev console and Firebase dev console (https://firebase.google.com/docs/cloud-messaging/ios/certs)

###### XCode config

- open "platforms/ios/PIA.xcodeproj" in XCode
- XCode -> Preferences -> add apple_dev@conventic.com as account and download profiles
- automatically manage singing: "OFF"
- Bundle identifier: "de.info-pia.app"
- Provisioning Profile (Pia_App_Store)
- Architectures: Excluded Architectures: For both Debug / Release, and "Any iOS Simulator SDK", add an entry arm64 to avoid a linking error 65 and messages likes: Building for iOS Simulator, but linking in object file built for iOS.

###### Building and uploading to store

- make sure to use correct GoogleService-Info.plist for package "de.info-pia.app" (from Code base or Firebase Console)
- in project folder: `npm run build:ios`
- open "platforms/ios/PIA.xcodeproj" in XCode
- select "generic iOS device"
- select : Product -> Archive
- Distribute App -> App Store Connect -> Upload -> Next
- Distribution Certificate: "Default Apple Distribution"
- PIA.app: "Pia_App_Store"
- Next -> Upload

## Frequent Issues

### config.xml behaviour

Ionic will copy the initial state of the `config.xml` file when a build is started.
When running with livereload, the initial state will be brought back to the `config.xml` as soon as you stop the dev server.
Any change which was made in between will be lost!

Also, Cordova will parse the `config.xml` (and the referenced `network_security_config.xml`) and will make adjustments to it
based on its content. This will also add entries with IP-Adresses which where read from the `network_security_config.xml`.
**These changes should not be committed to the Git repo**! Keep it out of Git!

### iOS app cannot be built by cordova

Error: `xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance`

Solution: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

### No Java files found that extend CordovaActivity

Remove the platform folder and try again.

### More

https://ionicframework.com/docs/developing/tips
