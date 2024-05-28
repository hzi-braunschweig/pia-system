/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import 'reflect-metadata';
import util from 'util';
import {
  Connection,
  ConnectionNotFoundError,
  ConnectionOptions,
  createConnection,
  getConnection,
} from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { config } from './config';
import { FollowUp } from './entities/followUp';
import { SormasOneTimeToken } from './entities/sormasOneTimeToken';
import { SymptomTransmission } from './entities/symptomTransmission';
import { CreateFollowUp1629292341193 } from './migrations/1629292341193-CreateFollowUp';
import { CreateSormasOneTimeToken1629303381191 } from './migrations/1629303381191-CreateSormasOneTimeToken';
import { CreateSymptomTransmission1629900984235 } from './migrations/1629900984235-CreateSymptomTransmission';
import { ConvertPseudonymsToLowercase1643882418846 } from './migrations/1643882418846-ConvertPseudonymsToLowercase';

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
  entities: [FollowUp, SormasOneTimeToken, SymptomTransmission],
  namingStrategy: new SnakeNamingStrategyWithPlural(),
  synchronize: false,
  migrationsRun: true,
  migrations: [
    CreateFollowUp1629292341193,
    CreateSormasOneTimeToken1629303381191,
    CreateSymptomTransmission1629900984235,
    ConvertPseudonymsToLowercase1643882418846,
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
    } catch (_e) {
      console.log(
        `Database is not yet available. Waiting for ${delay} ms before next retry.`
      );
      if (i < retryCount) await sleep(delay);
    }
  }
  throw new Error(`Could not reach database after ${retryCount} retries`);
}
