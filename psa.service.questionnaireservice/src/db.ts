/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import 'reflect-metadata';
import {
  Connection,
  ConnectionNotFoundError,
  createConnections,
  getConnection,
} from 'typeorm';
import { config } from './config';
import pgPromise, { IDatabase } from 'pg-promise';
import {
  createTransactionRunner,
  DbConnectionGetterFn,
  RepositoryHelper,
  TransactionRunnerFn,
} from '@pia/lib-service-core';
import { QuestionnaireInstance } from './entities/questionnaireInstance';
import { Questionnaire } from './entities/questionnaire';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Question } from './entities/question';
import { AnswerOption } from './entities/answerOption';
import { Condition } from './entities/condition';
import { Answer } from './entities/answer';
import util from 'util';
import { ConnectionOptions } from 'typeorm/connection/ConnectionOptions';
import { UserFile } from './entities/userFile';
import { RenameLabelToVariableName1668436755983 } from './migrations/1668436755983-RenameLabelToVariableName';
import { AddCustomName1705593083327 } from './migrations/1705593083327-AddCustomName';
import { AddHelpText1710161762375 } from './migrations/1710161762375-AddHelpText';
import { AddNotificationLinkToOverview1718963386491 } from './migrations/1718963386491-AddNotificationLinkToOverview';
import { AddSortOrder1718022737421 } from './migrations/1718022737421-AddSortOrder';

const pgp = pgPromise({ capSQL: true, noLocking: config.isTestMode });
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const defaultStatementTimeout = 60 * 60 * 1000; // 1 hour

export const db: IDatabase<unknown> = pgp({
  ...config.database,
  statement_timeout: defaultStatementTimeout,
});
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

const exportPoolConnectionName = 'export-pool';

export const getExportPoolConnection = (): Connection => {
  return getConnection(exportPoolConnectionName);
};

const typeOrmOptions: ConnectionOptions = {
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.database,
  entities: [
    QuestionnaireInstance,
    Questionnaire,
    Question,
    AnswerOption,
    Condition,
    Answer,
    UserFile,
  ],
  namingStrategy: new SnakeNamingStrategyWithPlural(),
  synchronize: false,
  migrationsRun: true,
  migrations: [
    RenameLabelToVariableName1668436755983,
    AddCustomName1705593083327,
    AddHelpText1710161762375,
    AddNotificationLinkToOverview1718963386491,
    AddSortOrder1718022737421,
  ],
  logging: false,
  extra: { poolSize: 100 },
};

export async function connectDatabase(
  retryCount = 24,
  delay = 1000
): Promise<Connection[]> {
  const sleep = util.promisify(setTimeout);
  if (retryCount <= 0) throw new Error('retryCount must be greater than 0');
  // try to get existing connection
  try {
    return [getConnection(), getExportPoolConnection()];
  } catch (e) {
    if (!(e instanceof ConnectionNotFoundError)) throw e;
  }
  // if no connection found try to connect
  for (let i = 0; i <= retryCount; i++) {
    try {
      return await createConnections([
        {
          ...typeOrmOptions,
          name: 'default',
          extra: {
            poolSize: 10,
            options: `-c statement_timeout=${defaultStatementTimeout}ms`,
          },
        },
        {
          ...typeOrmOptions,
          name: exportPoolConnectionName,
          extra: {
            poolSize: 50,
            options: `-c statement_timeout=${defaultStatementTimeout}ms`,
          },
        },
      ]);
    } catch (err) {
      console.log(err);
      console.log(
        `Database is not yet available. Waiting for ${delay} ms before next retry.`
      );
      if (i < retryCount) await sleep(delay);
    }
  }
  throw new Error(`Could not reach database after ${retryCount} retries`);
}
