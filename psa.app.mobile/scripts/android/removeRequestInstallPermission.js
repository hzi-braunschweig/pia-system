/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const path = require('path');

function removeRequestInstallPackagesPermission(context) {
  console.log('Removing "REQUEST_INSTALL_PACKAGES" permission...');

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

  const permissionElement = configFile.data.find(
    './uses-permission[@android:name="android.permission.REQUEST_INSTALL_PACKAGES"]'
  );

  if (permissionElement) {
    configFile.data.getroot().remove(permissionElement);
    console.log('Successfully removed "REQUEST_INSTALL_PACKAGES" permission');
  } else {
    console.log(
      'Could not find "REQUEST_INSTALL_PACKAGES" permission -> skipping.'
    );
  }

  configFile.save();
}

/**
 * Google will reject apps with REQUEST_INSTALL_PACKAGES permission
 * that have not submitted a valid use via additional verification.
 * Therefore, we hereby get sure that this permission will not be included.
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
    removeRequestInstallPackagesPermission(context);
  } catch (error) {
    console.error(error.message);
  }
};
