/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { DatabaseChart } from '../generic/database';

export class IPiaService extends DatabaseChart {
  public constructor(scope: Construct, configuration: Configuration) {
    super(
      scope,
      'ipiaservice',
      'psa.database.ipia',
      configuration.getVariables({
        POSTGRES_USER: configuration.variables.ipia.user,
        POSTGRES_PASSWORD: configuration.variables.ipia.password,

        POSTGRES_DB: configuration.variables.ipia.db,
        DB_PERSONALDATA_USER: configuration.variables.personaldataUser,

        DB_PERSONALDATA_PASSWORD: configuration.variables.personaldataPassword,

        DB_AUTHSERVER_USER: configuration.variables.authserverUser,

        DB_AUTHSERVER_PASSWORD: configuration.variables.authserverPassword,
      }),
      configuration
    );
  }
}
