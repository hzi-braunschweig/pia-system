/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import 'reflect-metadata';
import * as util from 'node:util';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from './config';
import { Configuration } from './entity/configuration';
import { Event } from './entity/event';
import { CreateConfiguration1713428094152 } from './migrations/1713428094152-CreateConfiguration';
import { CreateEvents1713428103643 } from './migrations/1713428103643-CreateEvents';
import { SnakeNamingStrategyWithPlural } from './util/snakeNamingStrategyWithPlural';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.database,
  namingStrategy: new SnakeNamingStrategyWithPlural(),
  synchronize: false,
  migrationsRun: true,
  logging: false,
  entities: [Configuration, Event],
  migrations: [CreateConfiguration1713428094152, CreateEvents1713428103643],
  subscribers: [],
};

export const dataSource = new DataSource(dataSourceOptions);

export async function connectDatabase(
  retryCount = 24,
  delay = 1000
): Promise<void> {
  const sleep = util.promisify(setTimeout);
  if (retryCount <= 0) throw new Error('retryCount must be greater than 0');
  for (let i = 0; i <= retryCount && !dataSource.isInitialized; i++) {
    if (i !== 0) {
      console.log(
        `Database is not yet available. Waiting for ${delay} ms before next retry.`
      );
      await sleep(delay);
    }
    try {
      await dataSource.initialize();
    } catch (e) {
      if (e && (e as { code: string }).code !== 'ECONNREFUSED')
        throw e as Error;
    }
  }
  if (!dataSource.isInitialized) {
    throw new Error(`Could not reach database after ${retryCount} retries`);
  }
}
