/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { DatabaseChart } from '../generic/database';

export class EwPiaService extends DatabaseChart {
  public constructor(scope: Construct, configuration: Configuration) {
    super(
      scope,
      'ewpiaservice',
      'psa.database.ewpia',
      configuration.getVariables({
        POSTGRES_USER: configuration.variables.ewpia.user,
        POSTGRES_PASSWORD: configuration.variables.ewpia.password,
        POSTGRES_DB: configuration.variables.ewpia.db,
      }),
      configuration
    );
  }
}
