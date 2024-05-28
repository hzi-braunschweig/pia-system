# psa.app.mobile

PIA Mobile App for iOS and Android.

## Development

Install dependencies: `npm install`

### Device / Emulator

To run the app on a device or an emulator you need to install the following packages globally:

- `npm install -g native-run`
- `npm install -g cordova`
- `npm install -g @ionic/cli`

After setup and installing additional dependencies (sections about iOS and Android) you can start the app by running
`start:<plattform>:<emulator|device>`.

- You can choose a device if you add ` -- --target <ID>`
- You can get a list of supported devices by adding ` -- --list`

#### Configure Keycloak

Login into [Keycloak](https://pia-app/api/v1/auth/) and add `http://0.0.0.0:8100/` as a web origin to the
`pia-proband-mobile-app-client` in the `pia-proband-realm`.

Please see specific instructions for Android, on how to let the android emulator resolve the `pia-app` hostname.

#### iOS

For building the iOS app you will need a Mac with xcode installed. To install xcode execute:

- `xcode-select --install`

Additional setup is required for Cordova to support programmatic builds:

- `npm install -g ios-sim`
- `brew install ios-deploy`
- `sudo gem install cocoapods`

Run the app with live reload:

- Emulator: `npm run start:ios:emulator`
- Device: `npm run start:ios:device`

To access your local PIA instance from an emulated device, you need to drag and drop your root
certificate from `pia-ansible/local/generated/secrets/ssl/ca.cert` onto the emulator window.

Debug in Safari:

- open Safari
- enable developer options in Safari settings
- click on Developer
- search for the emulator or device and click on the app

Further reading: https://ionicframework.com/docs/developing/ios

#### Android

For building the Android app you will need the Android SDK, Java JDK **8** and the Gradle build tool.

If you want to use your local PIA instance and an emulated device, you need to follow these steps:

##### 1. Create a new Android emulator device which uses the current SDK version

See [config.xml](./config.xml) `android-targetSdkVersion` for which SDK version is required.

The device image **must not be a Play Store image** or else you won't be able to root the device in the next step.

##### 3. Modify [`network_security_config.xml`](./resources/android/xml/network_security_config.xml)

> The following changes should **never** be committed. They are for **development only**.

Replace

```xml
<domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">localhost</domain>
</domain-config>
```

with

```xml
<base-config cleartextTrafficPermitted="true">
    <trust-anchors>
        <certificates src="system"/>
    </trust-anchors>
</base-config>
<domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">*</domain>
</domain-config>
```

##### 4. Add `pia-app` to your device host file

The following steps are required to let the android emulator resolve the `pia-app` hostname.
You only need to do this once or after a reset.

Start the emulated device with writable file system (given `ANDROID_HOME` is set):

```sh
$ANDROID_HOME/emulator/emulator -avd <device-name> -writable-system
```

> ℹ️ You can find the device name by running `$ANDROID_HOME/emulator/emulator -list-avds`.

Then run the following commands:

```sh
adb root
adb remount
adb shell
# now you are in the device shell
cd system/etc
cat hosts # should show the current hosts file
echo "0.0.0.0 pia-app" >> hosts # replace 0.0.0.0 with you network IP
cat hosts # should show the updated hosts file
exit
# end of device shell
```

Run the app with live reload:

- Emulator: `npm run start:android:emulator`

Debug in Chrome:

- open `chrome://inspect#devices`
- search for the emulator or device and click "inspect"

Further reading: https://ionicframework.com/docs/developing/android

## Deployment

### Create New Release

- raise package version in `package.json`
- raise app version in `config.xml`

### App Variants

We currently publish Apps for the Play Store and Apple App Store with different app identifiers:

- Android App ID: android-packageName="de.pia.app"
- iOS App ID: ios-CFBundleIdentifier="de.info-pia.app"

### Build Release

#### Ionic AppFlow

- Android or iOS builds can be triggered via Gitlab CI
- Ionic will execute `npm run build` to build the webapp for an Android or iOS release

#### Local

Apps should always be built by Ionic AppFlow. Use the following steps only if that does not work.

##### Android

- `npm run build:android` will build the APK file (Android SDK needed - see above)
- You need jarsigner from JDK in your PATH, zipalign installed and the keystore (use keystore from confluence! app
  updates won't work otherwise)
- `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk alias_name`
- `zipalign -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk PIA.apk`

##### iOS

###### Prerequisites in Apple Dev Console (Select none Enterprise HZI Team)

- App ID with "de.info-pia.app" package name and push notification permission (XCode generated that, but manual should
  be possible too)
- Apple Distribution Certificate (in dev console AND priv key on Macbook) (
  see https://support.magplus.com/hc/en-us/articles/203808748-iOS-Creating-a-Distribution-Certificate-and-p12-File)
- or in short: create certificate signing request on mac, upload to dev console, create certificate, download to mac and
  add to key chain
- Provisioning Profile of type "App Store" connected to above certificate and APP ID ("Pia_App_Store")
- Apple Push Notification Key in dev console and Firebase dev
  console (https://firebase.google.com/docs/cloud-messaging/ios/certs)

###### XCode config

- open "platforms/ios/PIA.xcodeproj" in XCode
- XCode -> Preferences -> add apple_dev@conventic.com as account and download profiles
- automatically manage singing: "OFF"
- Bundle identifier: "de.info-pia.app"
- Provisioning Profile (Pia_App_Store)
- Architectures: Excluded Architectures: For both Debug / Release, and "Any iOS Simulator SDK", add an entry arm64 to
  avoid a linking error 65 and messages likes: Building for iOS Simulator, but linking in object file built for iOS.

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
When running with livereload, the initial state will be brought back to the `config.xml` as soon as you stop the dev
server.
Any change which was made in between will be lost!

Also, Cordova will parse the `config.xml` (and the referenced `network_security_config.xml`) and will make adjustments
to it based on its content. This will also add entries with IPs which where read from the `network_security_config.xml`.
**These changes should not be committed to the Git repo**! Keep it out of Git!

### iOS app cannot be built by cordova

Error: `xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance`

Solution: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

### No Java files found that extend CordovaActivity

Remove the platform folder and try again.

### More

https://ionicframework.com/docs/developing/tips

## Prefix generation for backend_mapping.ts

For the prefix generation see [Readme](../psa.utils.scripts/prefixes-for-backend-mapping/README.md)
