/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Chart } from 'cdk8s';
import { EnvValue, ISecret, Secret } from 'cdk8s-plus-25';
import { Construct } from 'constructs';
import { getFilesInDirectory } from './helper';
import * as crypto from 'crypto';

const passwords = {
  qpia_superuser_db: null,
  ewpia_supersuser_db: null,
  ipia_superuser_db: null,
  loggingservice_db: null,
  sormasservice_db: null,
  feedbackstatisticservice_db: null,
  eventhistoryserver_db: null,
  personaldataservice_db: null,
  authserver_db: null,
  authserver_admin_user: null,
  authserver_proband_management_client_secret: null,
  authserver_admin_management_client_secret: null,
  authserver_proband_token_introspection_client_secret: null,
  authserver_admin_token_introspection_client_secret: null,
  messagequeue_admin: null,
  messagequeue_app: null,
};

export type PasswordName = keyof typeof passwords;

export class InternalSecrets {
  private static readonly secretName = `internal-secrets`;

  public static getSecret(scope: Construct): ISecret {
    return Secret.fromSecretName(
      scope,
      'internal-secrets',
      InternalSecrets.secretName
    );
  }

  public static getPassword(secret: ISecret, password: PasswordName): EnvValue {
    return secret.envValue(`${password}.password`);
  }

  public static createChart(scope: Construct): Chart {
    const result = new Chart(scope, 'internal-secrets');

    const secret = new Secret(result, 'internal-secrets', {
      metadata: {
        name: InternalSecrets.secretName,
      },
    });

    for (const password of Object.keys(passwords)) {
      secret.addStringData(
        `${password}.password`,
        Buffer.from(crypto.randomBytes(64)).toString('hex')
      );
    }

    return result;
  }

  public static getMissing(path: string): string[] {
    const files = getFilesInDirectory(path);

    const expected = [
      ...Object.keys(passwords).map((password) => `${password}.password`),
    ];

    return expected.filter((configName) => !files.includes(configName));
  }
}
