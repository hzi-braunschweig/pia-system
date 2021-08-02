/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const path = require('path');

function setNSAllowsArbitraryLoadsFalse(context) {
  const cordovaCommon = context.requireCordovaModule('cordova-common');
  const iosPlatformRoot = path.join(context.opts.projectRoot, 'platforms/ios');

  const configFile = new cordovaCommon.ConfigFile(
    iosPlatformRoot,
    'ios',
    '*-Info.plist'
  );

  if (!configFile.data.NSAppTransportSecurity) {
    throw new ReferenceError(
      'Could not set "NSAllowsArbitraryLoads" to false. NSAppTransportSecurity is not available'
    );
  }

  configFile.data.NSAppTransportSecurity.NSAllowsArbitraryLoads = false;
  configFile.save();
}

/**
 * For security reasons we hereby enforce setting NSAllowsArbitraryLoads to false for
 * all iOS release builds. This will disallow all unsecured HTTP connections.
 *
 * This script is expected to be called within the Cordova hooks after_prepare phase.
 * The setting cannot simply be set within the config.xml as it will be overwritten.
 *
 * @see {@link https://developer.apple.com/documentation/bundleresources/information_property_list/nsapptransportsecurity/nsallowsarbitraryloads}
 *
 * @param context Cordova execution context
 */
module.exports = (context) => {
  // Make sure ios platform is part of build
  if (!context.opts.platforms.includes('ios')) {
    return;
  }

  try {
    console.log('Setting "NSAllowsArbitraryLoads" to false in ios config...');
    setNSAllowsArbitraryLoadsFalse(context);
    console.log('Successfully set "NSAllowsArbitraryLoads" to false');
  } catch (error) {
    console.error(error.message);
  }
};
