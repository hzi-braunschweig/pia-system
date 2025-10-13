/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
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
import { Question } from './entities/question';
import { AnswerOption } from './entities/answerOption';
import { Condition } from './entities/condition';
import { Answer } from './entities/answer';
import util from 'util';
import { UserFile } from './entities/userFile';
import { RenameLabelToVariableName1668436755983 } from './migrations/1668436755983-RenameLabelToVariableName';
import { AddCustomName1705593083327 } from './migrations/1705593083327-AddCustomName';
import { AddHelpText1710161762375 } from './migrations/1710161762375-AddHelpText';
import { AddNotificationLinkToOverview1718963386491 } from './migrations/1718963386491-AddNotificationLinkToOverview';
import { AddSortOrder1718022737421 } from './migrations/1718022737421-AddSortOrder';
import { CreateQuestionnaireInstanceOrigins1723188490598 } from './migrations/1723188490598-CreateQuestionnaireInstanceOrigins';
import { QuestionnaireInstanceOrigin } from './entities/questionnaireInstanceOrigin';
import { QuestionnaireInstanceQueue } from './entities/questionnaireInstanceQueue';
import { AddUseAutocompleteToAnswerOptions1721410716900 } from './migrations/1721410716900-AddUseAutocompleteToAnswerOptions';
import { SnakeNamingStrategyWithPlural } from './util/snakeNamingStrategyWithPlural';

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
  entities: [
    QuestionnaireInstanceQueue,
    QuestionnaireInstanceOrigin,
    QuestionnaireInstance,
    Questionnaire,
    Question,
    AnswerOption,
    Condition,
    Answer,
    UserFile,
  ],
  migrations: [
    RenameLabelToVariableName1668436755983,
    AddCustomName1705593083327,
    AddHelpText1710161762375,
    AddNotificationLinkToOverview1718963386491,
    AddSortOrder1718022737421,
    AddUseAutocompleteToAnswerOptions1721410716900,
    CreateQuestionnaireInstanceOrigins1723188490598,
  ],
};

export const dataSource = new DataSource({
  ...dataSourceOptions,
  name: 'default',
  poolSize: 10,
  applicationName: 'questionnaireservice-default',
  extra: {
    poolSize: 10,
    options: `-c statement_timeout=${defaultStatementTimeout}ms`,
  },
});
export const dataSourceExport = new DataSource({
  ...dataSourceOptions,
  name: 'export-pool',
  poolSize: 10,
  applicationName: 'questionnaireservice-export',
  migrationsRun: false,
  extra: {
    poolSize: 50,
    options: `-c statement_timeout=${defaultStatementTimeout}ms`,
  },
});

let singleDatasourceConnection: Promise<void> | undefined;

export async function connectDatabase(
  retryCount = 24,
  delay = 1000
): Promise<void> {
  if (!singleDatasourceConnection) {
    singleDatasourceConnection = connectDataSource(retryCount, delay);
  }
  return singleDatasourceConnection;
}

async function connectDataSource(retryCount = 24, delay = 1000): Promise<void> {
  const sleep = util.promisify(setTimeout);
  const ignoredErrorCodes = [
    'ECONNREFUSED',
    '57P03', // "Could not start the server: error: the database system is starting up"
  ];

  if (retryCount <= 0) throw new Error('retryCount must be greater than 0');
  for (
    let i = 0;
    i <= retryCount &&
    (!dataSource.isInitialized || !dataSourceExport.isInitialized);
    i++
  ) {
    if (i !== 0) {
      console.log(
        `Database is not yet available. Waiting for ${delay} ms before next retry.`
      );
      await sleep(delay);
    }
    try {
      await Promise.all([
        !dataSource.isInitialized ? dataSource.initialize() : dataSource,
        !dataSourceExport.isInitialized
          ? dataSourceExport.initialize()
          : dataSourceExport,
      ]);
    } catch (e: unknown) {
      const errorCode = ((e ?? {}) as { code?: string }).code;
      if (errorCode && ignoredErrorCodes.includes(errorCode)) {
        continue;
      }
      console.warn(e);
    }
  }
  if (!dataSource.isInitialized || !dataSourceExport.isInitialized) {
    throw new Error(`Could not reach database after ${retryCount} retries`);
  }
}
