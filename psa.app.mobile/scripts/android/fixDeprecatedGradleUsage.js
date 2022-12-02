/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const path = require('path');
const { readFile, writeFile } = require('fs/promises');

const fixDeprecatedGradleUsage = async (context) => {
  console.log(
    'Replacing deprecated usage of "compile()" by "implementation()"...'
  );

  const barcodeScannerGradleFile = path.join(
    context.opts.projectRoot,
    'platforms/android/phonegap-plugin-barcodescanner/app-barcodescanner.gradle'
  );

  try {
    let gradleFileContent = await readFile(barcodeScannerGradleFile, 'utf8');

    gradleFileContent = gradleFileContent.replace(
      "compile(name:'barcodescanner-release-2.1.5', ext:'aar')",
      "implementation(name:'barcodescanner-release-2.1.5', ext:'aar')"
    );

    await writeFile(barcodeScannerGradleFile, gradleFileContent, 'utf8');

    console.log(
      'Successfully fixed gradle file of phonegap-plugin-barcodescanner'
    );
  } catch (err) {
    console.error(err);
    console.log('Could not find phonegap-plugin-barcodescanner gradle file');
  }
};

/**
 *
 * @see {@link https://forum.ionicframework.com/t/error-when-i-build-with-phonegap-barcodescanner-ionic-native/218337}
 *
 * This script is expected to be called within the Cordova hooks after_prepare phase.
 *
 * @param context Cordova execution context
 */
module.exports = async (context) => {
  // Make sure android platform is part of build
  if (!context.opts.platforms.includes('android')) {
    return;
  }

  try {
    await fixDeprecatedGradleUsage(context);
  } catch (error) {
    console.error(error.message);
  }
};
