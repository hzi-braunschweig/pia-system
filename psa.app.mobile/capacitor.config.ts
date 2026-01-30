/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.pia.app',
  appName: 'PIA',
  webDir: 'www/browser',
  cordova: {
    preferences: {
      'android-minSdkVersion': '26',
      'android-targetSdkVersion': '35',
      ScrollEnabled: 'false',
      BackupWebStorage: 'none',
      AndroidPersistentFileLocation: 'Internal',
      iosPersistentFileLocation: 'Library',
      DisableDeploy: 'true',
      AndroidXEnabled: 'true',
      GradlePluginGoogleServicesEnabled: 'true',
    },
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      backgroundColor: '#f1f6ed',
      launchShowDuration: 3000,
      launchFadeOutDuration: 300,
      splashFullScreen: true,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#599118', // --ion-color-tertiary
    },
    Badge: {
      persist: true,
      autoClear: false,
    },
  },
  server: {
    iosScheme: 'ionic', // to keep local storage data on iOS after the capacitor migration (see https://capacitorjs.com/docs/cordova/migrating-from-cordova-to-capacitor#setting-scheme)
  },
  android: {
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
