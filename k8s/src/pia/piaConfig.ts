/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { EnvValue, ISecret } from 'cdk8s-plus-25';
import { getFilesInDirectory } from './helper';

const ConfigNames = {
  webappUrl: null,
  externalProtocol: null,
  externalPort: null,
  externalHost: null,
  mailServerHostName: null,
  mailServerPort: null,
  mailServerUserName: null,
  mailServerPassword: null,
  mailServerRequireTls: null,
  mailServerFromAddress: null,
  mailServerFromName: null,
  probandTermsOfServiceUrl: null,
  probandPolicyUrl: null,
  modysBaseUrl: null,
  modysUserName: null,
  modysPassword: null,
  modysStudy: null,
  modysIdentifierTypeId: null,
  modysRequestConcurrency: null,
  defaultLanguage: null,
  userPasswordLength: null,
  isSormasEnabled: null,
  mailhogAuth: null,
  firebasePrivateKeyBase64: null,
  firebaseProjectId: null,
  firebaseClientEmail: null,
};

type ConfigName = keyof typeof ConfigNames;

export class PiaConfig {
  public static getConfig(secret: ISecret, configName: ConfigName): EnvValue {
    return secret.envValue(configName);
  }

  public static getConfigFile(
    secret: ISecret,
    fileName: ConfigName
  ): { name: string; secret: ISecret } {
    return {
      name: fileName,
      secret: secret,
    };
  }

  public static getMissing(path: string): string[] {
    const files = getFilesInDirectory(path);
    return Object.keys(ConfigNames).filter(
      (configName) => !files.includes(configName)
    );
  }
}
