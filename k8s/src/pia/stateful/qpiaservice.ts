/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { DatabaseChart } from '../generic/database';

export class QPiaService extends DatabaseChart {
  public constructor(scope: Construct, configuration: Configuration) {
    super(
      scope,
      'qpiaservice',
      'psa.database',
      configuration.getVariables({
        POSTGRES_USER: configuration.variables.qpia.user,
        POSTGRES_PASSWORD: configuration.variables.qpia.password,

        POSTGRES_DB: configuration.variables.qpia.db,
        DB_LOG_USER: configuration.variables.logUser,
        DB_LOG_PASSWORD: configuration.variables.logPassword,
        DB_SORMAS_USER: configuration.variables.sormasUser,
        DB_SORMAS_PASSWORD: configuration.variables.sormasPassword,

        DB_FEEDBACKSTATISTIC_USER:
          configuration.variables.feedbackStatisticUser,
        DB_FEEDBACKSTATISTIC_PASSWORD:
          configuration.variables.feedbackStatisticPassword,

        DB_EVENTHISTORY_USER: configuration.variables.eventHistoryUser,
        DB_EVENTHISTORY_PASSWORD: configuration.variables.eventHistoryPassword,
      }),
      configuration
    );
  }
}
