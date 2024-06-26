/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from './config';
import pgPromise from 'pg-promise';
import {
  createTransactionRunner,
  DbConnectionGetterFn,
  RepositoryHelper,
  TransactionRunnerFn,
} from '@pia/lib-service-core';
import util from 'util';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import {
  Connection,
  ConnectionNotFoundError,
  ConnectionOptions,
  createConnection,
  getConnection,
} from 'typeorm';
import { Proband } from './entities/proband';
import { Study } from './entities/study';
import { PlannedProband } from './entities/plannedProband';
import { StudyAccess } from './entities/studyAccess';
import { StudyWelcomeMail } from './entities/studyWelcomeMail';
import { CreateStudyWelcomeMail1664954890203 } from './migrations/1664954890203-CreateStudyWelcomeMail';
import { AddProbandCreatedAtOrigin1666003459920 } from './migrations/1666003459920-AddProbandCreatedAtOrigin';
import { AlterProbandCreatedAtOriginDefaultValue1666089544308 } from './migrations/1666089544308-AlterProbandCreatedAtOriginDefaultValue';
import { AddPublicApiValueToProbandOrigin1697808103826 } from './migrations/1697808103826-AddPublicApiValueToProbandOrigin';

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
  entities: [Proband, Study, PlannedProband, StudyAccess, StudyWelcomeMail],
  namingStrategy: new SnakeNamingStrategyWithPlural(),
  synchronize: false,
  migrationsRun: true,
  migrations: [
    CreateStudyWelcomeMail1664954890203,
    AddProbandCreatedAtOrigin1666003459920,
    AlterProbandCreatedAtOriginDefaultValue1666089544308,
    AddPublicApiValueToProbandOrigin1697808103826,
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
