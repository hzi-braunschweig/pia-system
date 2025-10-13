/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { EnvValue, EnvValueFromSecretOptions, ISecret } from 'cdk8s-plus-25';
import { getFilesInDirectory } from './helper';

const requiredConfigNames = [
  'webappUrl',
  'externalProtocol',
  'externalPort',
  'externalHost',
  'mailServerHostName',
  'mailServerPort',
  'mailServerUserName',
  'mailServerPassword',
  'mailServerRequireTls',
  'mailServerFromAddress',
  'mailServerFromName',
  'probandTermsOfServiceUrl',
  'probandPolicyUrl',
  'defaultLanguage',
  'userPasswordLength',
  'isSormasEnabled',
  'mailhogAuth',
  'firebasePrivateKeyBase64',
  'firebaseProjectId',
  'firebaseClientEmail',
  'notificationHour',
  'notificationMinute',
] as const;

const optionalConfigNames = ['httpsProxyUrl'] as const;

type ConfigName =
  | (typeof requiredConfigNames)[number]
  | (typeof optionalConfigNames)[number];

export class PiaConfig {
  public static getConfig(
    secret: ISecret,
    configName: ConfigName,
    options?: EnvValueFromSecretOptions
  ): EnvValue {
    return secret.envValue(configName, options);
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
    return requiredConfigNames.filter(
      (configName) => !files.includes(configName)
    );
  }
}
