/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  defaultLanguage: 'en-US',
  matomoUrl: '', // https://testpia-app.de/matomo/ | https://pia-app.de/matomo/
  isSormasEnabled: true, // String, as will be imported from env variable in production
  isDevelopmentSystem: true,
  firebase: {
    apiKey: 'AIzaSyDf4H-r-iDYG1lVtlDQXs2xJTmvDT4lzV0',
    authDomain: 'pia-app-c50e8.firebaseapp.com',
    projectId: 'pia-app-c50e8',
    storageBucket: 'pia-app-c50e8.appspot.com',
    messagingSenderId: '1012552142126',
    appId: '1:1012552142126:web:1cdd40ece476ebfea83ebf',
  },
  vapidKey:
    'BIYVU_3SGxao99eC0FwrtDKe-JV51ENGAf_W2oaoeYMDuLX0av2IMCzSVHELHSs42wfac3swmGclhSp6R9IGfIo',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
