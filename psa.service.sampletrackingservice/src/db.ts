/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from './config';
import util from 'util';

import pgPromise from 'pg-promise';
import {
  createTransactionRunner,
  DbConnectionGetterFn,
  RepositoryHelper,
  TransactionRunnerFn,
} from '@pia/lib-service-core';

import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import {
  Connection,
  ConnectionNotFoundError,
  ConnectionOptions,
  createConnection,
  getConnection,
} from 'typeorm';
import { LabResult } from './entities/labResult';
import { LabResultTemplate } from './entities/labResultTemplate';
import { CreateLabResultTemplate1687426335432 } from './migrations/1687426335432-CreateLabResultTemplate';

const pgp = pgPromise({ capSQL: true });

export const db: pgPromise.IDatabase<unknown> = pgp(config.database);
export const runTransaction: TransactionRunnerFn = createTransactionRunner(db);
export const getDbTransactionFromOptionsOrDbConnection: DbConnectionGetterFn =
  RepositoryHelper.createDbConnectionGetter(db);

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
  entities: [LabResultTemplate, LabResult],
  namingStrategy: new SnakeNamingStrategyWithPlural(),
  synchronize: false,
  migrationsRun: true,
  migrations: [CreateLabResultTemplate1687426335432],
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
