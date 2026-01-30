# psa.app.mobile

PIA Mobile App for iOS and Android.

## Development

Install dependencies: `npm install`

## Device / Emulator

To run the app on a device or an emulator you can use one of the following commands:

- `npm run start:android`
- `npm run start:ios`

Alternatively, you can open Android Studio and run it from there (see [Capacitor Android Documentation](https://capacitorjs.com/docs/android#running-your-app)). You can start Android Studio by running `npm run open:android`.

#### Configure Keycloak

Login into [Keycloak](https://pia-app/api/v1/auth/) and add `http://0.0.0.0:8100/` as a web origin to the
`pia-proband-mobile-app-client` in the `pia-proband-realm`.

Please see specific instructions for Android, on how to let the android emulator resolve the `pia-app` hostname.

#### iOS

For building the iOS app you will need a Mac with xcode installed. To install xcode execute:

- `xcode-select --install`

Additionally, you need the dependency manager for Swift `cocoapods` which is built with `Ruby`. It is not recommended to use the Ruby installation provided by the system, but install a newer Ruby. You can do this e.g. with `Homebrew`:

- `brew install ruby`

Then install `cocoapods` with

- `sudo gem install cocoapods`

Run the app:

- `npm run start:ios`

To access your local PIA instance from an emulated iOS device, your connection needs to use SSL. We recommend following the [developer documentation](../docs/development.md), which explains how to add your own, trusted certificates to your ingress controllers. After following these instructions, you can open the location of your root certificate by running

```sh
open "$(mkcert -CAROOT)"
```

Drag and drop the root certificate onto your iOS emulator to trust it.

Debug in Safari:

- open Safari
- enable developer options: Safari settings -> Advanced -> Show features for web developers
- click on Develop
- search for the emulator or device and click on the app

If the logs do not work, because a css file was not found, it might help to compile for prod: `ionic capacitor run ios --prod`.

Further reading: https://ionicframework.com/docs/developing/ios

#### Android

For building the Android app you will need the Android SDK, Java JDK **21** and the Gradle build tool.

Run the app with:

- `npm run start:android`

To access your local PIA instance from an emulated device, you need to follow these steps:

##### 1. Create a new Android emulator device which uses the current SDK version

See [variables.gradle](./android/variables.gradle) `targetSdkVersion` for which SDK version is required.

The device image **must not be a Play Store image** (use type `Default Android System Image`) or else you won't be able to root the device in the next step.

##### 2. Modify [`network_security_config.xml`](./android/app/src/main/res/xml/network_security_config.xml)

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

##### 3. Add `pia-app` to your device host file

The following steps are required to let the android emulator resolve the `pia-app` hostname.
You only need to do this once or after a reset.

Start the emulated device with writable file system (given `ANDROID_HOME` is set):

```sh
$ANDROID_HOME/emulator/emulator -avd <device-name> -writable-system -selinux permissive
```

> ℹ️ You can find the device name by running `$ANDROID_HOME/emulator/emulator -list-avds`.

Then run the following commands:

```sh
adb root
adb disable-verity # this command might take some time
adb reboot # this command might take some time (the emulator should reboot)
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

Run the app with:

- `npm run start:android`

Debug in Chrome:

- open `chrome://inspect#devices`
- search for the emulator or device and click "inspect"

Further reading: https://ionicframework.com/docs/developing/android

## Deployment

### Create a new Release

- raise package version in [package.json](package.json)
- raise app version in [build.gradle](android/app/build.gradle)for android
- raise app version in [Info.plist](ios/App/App/Info.plist) for iOS

Alternatively, the version can also be set with the official Ionic vscode extension.

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

- in project folder: `npm run build:ios`
- open "platforms/ios/PIA.xcodeproj" in XCode
- select "generic iOS device"
- select : Product -> Archive
- Distribute App -> App Store Connect -> Upload -> Next
- Distribution Certificate: "Default Apple Distribution"
- PIA.app: "Pia_App_Store"
- Next -> Upload

## Frequent Issues

### Android: Inconsistent JVM-target compatibility

Error when building the android app: `Inconsistent JVM-target compatibility detected for tasks 'compileDebugJavaWithJavac' (*) and 'compileDebugKotlin' (*)`

Solution: Change the `Gradle JDK` in the Android Studio settings version to 21.

### iOS app cannot be built

Error: `xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance`

Solution: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

Error: `CocoaPods could not find compatible versions for pod "FirebaseMessaging"`

Solution: `cd ios/App && rm Podfile.lock && pod install` - do not commit you own, local `Podfile.lock`.

### More

https://ionicframework.com/docs/developing/tips

## Prefix generation for backend_mapping.ts

For the prefix generation see [Readme](../psa.utils.scripts/prefixes-for-backend-mapping/README.md)
