/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fs = require('fs');
const path = require('path');
const execa = require('execa');

function useNonPreCompiledFirestoreVersion(context) {
  const iosPlatformRoot = path.join(context.opts.projectRoot, 'platforms/ios');
  const podfilePath = path.join(iosPlatformRoot, 'Podfile');

  if (!fs.existsSync(podfilePath)) {
    console.log(
      `'${podfilePath}' does not exist. FirebaseFirestore fix skipped.`
    );
    return;
  }

  const preCompiledVersionString =
    "pod 'FirebaseFirestore', :tag => '9.1.0', :git => 'https://github.com/invertase/firestore-ios-sdk-frameworks.git'";

  let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

  if (podfileContent.includes(preCompiledVersionString)) {
    podfileContent = podfileContent.replace(
      preCompiledVersionString,
      "pod 'FirebaseFirestore', '9.1.0'"
    );

    fs.writeFileSync(podfilePath, podfileContent, 'utf-8');

    console.log('Installing non pre-compiled FirebaseFirestore...');

    return execa('pod', ['install', '--verbose'], {
      cwd: iosPlatformRoot,
    });
  } else {
    console.log('Could not set non pre-compiled FirebaseFirestore');
  }
}

/**
 * This hook overwrites the iOS Podfile to explicitly use a non pre-compiled version
 * of FirebaseFirestore.
 *
 * cordova-plugin-firebasex by default uses a pre-compiled version of its underlying
 * FirebaseFirestore dependency. As of writing these lines, it is not compatible to
 * Ionic AppFlow, which is already documented [here]{@link https://github.com/dpa99c/cordova-plugin-firebasex/issues/735#issuecomment-1180119363}.
 *
 * As a fix, cordova-plugin-firebasex has a setting "IOS_USE_PRECOMPILED_FIRESTORE_POD",
 * which, when set to false, should use a non pre-compiled version of FirebaseFirestore.
 * However, [due to a bug]{@link https://github.com/dpa99c/cordova-plugin-firebasex/issues/759}
 * this does not work as well. This is why this hook exists as a temporary fix.
 *
 * As using the non pre-compiled dependency leads to much higher build times (approx. +20min),
 * it would be preferable to return to the pre-compiled version as soon as possible.
 *
 * @param context Cordova execution context
 */
module.exports = (context) => {
  // Make sure ios platform is part of build
  if (!context.opts.platforms.includes('ios')) {
    return;
  }

  try {
    console.log('Setting non pre-compiled FirebaseFirestore...');
    return useNonPreCompiledFirestoreVersion(context);
  } catch (error) {
    console.error(error.message);
  }
};
