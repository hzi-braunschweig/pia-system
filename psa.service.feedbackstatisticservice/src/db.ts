/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from './config';
import util from 'util';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import {
  Connection,
  ConnectionNotFoundError,
  ConnectionOptions,
  createConnection,
  getConnection,
} from 'typeorm';
import { FeedbackStatisticConfiguration } from './entities/feedbackStatisticConfiguration';
import { FeedbackStatistic } from './entities/feedbackStatistic';
import {
  ComparativeValues,
  RelativeFrequencyTimeSeriesConfiguration,
} from './entities/relativeFrequencyTimeSeriesConfiguration';
import { CreateFeedbackStatisticConfiguration1675778337508 } from './migrations/1675778337508-CreateFeedbackStatisticConfiguration';
import { TimeRange } from './model/timeRange';
import { TimeSpan } from './model/timeSpan';
import { FeedbackStatisticTimeSeries } from './entities/feedbackStatisticTimeSeries';
import { CreateFeedbackStatistic1677224925180 } from './migrations/1677224925180-CreateFeedbackStatistic';

export class SnakeNamingStrategyWithPlural extends SnakeNamingStrategy {
  public tableName(className: string, customName: string): string {
    const snakeName = super.tableName(className, customName);
    if (customName) {
      return snakeName;
    } else if (snakeName.endsWith('y')) {
      return snakeName.substring(0, snakeName.length - 1) + 'ies';
    } else if (snakeName.endsWith('s')) {
      return snakeName + 'es';
    } else return snakeName + 's';
  }
}

const typeOrmOptions: ConnectionOptions = {
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.database,
  entities: [
    FeedbackStatisticConfiguration,
    FeedbackStatistic,
    RelativeFrequencyTimeSeriesConfiguration,
    ComparativeValues,
    FeedbackStatisticTimeSeries,
    TimeSpan,
    TimeRange,
  ],
  namingStrategy: new SnakeNamingStrategyWithPlural(),
  synchronize: false,
  migrationsRun: true,
  migrations: [
    CreateFeedbackStatisticConfiguration1675778337508,
    CreateFeedbackStatistic1677224925180,
  ],
  logging: false,
};

export async function connectDatabase(
  retryCount = 24,
  delay = 1000
): Promise<Connection> {
  const sleep = util.promisify(setTimeout);
  if (retryCount <= 0) throw new Error('retryCount must be greater than 0');
  // try to get existing connection
  try {
    return getConnection();
  } catch (e) {
    if (!(e instanceof ConnectionNotFoundError)) throw e;
  }
  // if no connection found try to connect
  for (let i = 0; i <= retryCount; i++) {
    try {
      return await createConnection(typeOrmOptions);
    } catch (e) {
      console.log(
        `Database is not yet available. Waiting for ${delay} ms before next retry.`,
        e
      );
      if (i < retryCount) await sleep(delay);
    }
  }
  throw new Error(`Could not reach database after ${retryCount} retries`);
}
