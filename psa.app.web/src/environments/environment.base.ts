/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FirebaseOptions } from 'firebase/app';
import { KeycloakConfig } from 'keycloak-js';

interface BaseEnvironment {
  probandAppBaseUrl: string;
  firebase: FirebaseOptions;
  vapidKey: string;
}

export interface Environment extends BaseEnvironment {
  production: boolean;
  baseUrl: string;
  defaultLanguage: string;
  isSormasEnabled: boolean;
  isDevelopmentSystem: boolean;
  isE2ETestSystem: boolean;
  authserver: KeycloakConfig;
}

/**
 * Configuration shared by every environment
 */
export const baseEnvironment: BaseEnvironment = {
  probandAppBaseUrl: window.location.origin,
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
