/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const path = require('path');

function addExportedAttributeToFirebasePlugin(context) {
  console.log(
    'Adding android:exported="true" to FirebasePluginMessagingService...'
  );

  const cordovaCommon = context.requireCordovaModule('cordova-common');
  const androidPlatformRoot = path.join(
    context.opts.projectRoot,
    'platforms/android'
  );

  const configFile = new cordovaCommon.ConfigFile(
    androidPlatformRoot,
    'android',
    'AndroidManifest.xml'
  );

  const serviceElements = configFile.data.findall(
    "./application/service[@android:name='org.apache.cordova.firebase.FirebasePluginMessagingService']"
  );

  let validElementExists = false;

  for (const element of serviceElements) {
    if (validElementExists) {
      configFile.data.find('./application').remove(element);
      console.log('Removed duplicated FirebasePluginMessagingService element');
    } else {
      if (serviceElements[0].attrib.hasOwnProperty('android:exported')) {
        console.log('android:exported="true" already added -> skipping.');
      } else {
        serviceElements[0].set('android:exported', 'false');
        console.log(
          'Successfully added android:exported="true" to FirebasePluginMessagingService'
        );
      }
      validElementExists = true;
    }
  }

  configFile.save();
}

/**
 * With version 14.2.1-cli of cordova-plugin-firebasex the mobile app cannot be built for
 * Android 12 due to a missing android:exported property. With this hook we manually
 * edit the AndroidManifest to get sure this property exists for FirebasePluginMessagingService.
 *
 * @see {@link https://github.com/dpa99c/cordova-plugin-firebasex/issues/727}
 *
 * This script is expected to be called within the Cordova hooks after_prepare phase.
 *
 * @param context Cordova execution context
 */
module.exports = (context) => {
  // Make sure android platform is part of build
  if (!context.opts.platforms.includes('android')) {
    return;
  }

  try {
    addExportedAttributeToFirebasePlugin(context);
  } catch (error) {
    console.error(error.message);
  }
};
