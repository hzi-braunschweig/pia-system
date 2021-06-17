import { config } from './config';
import pgPromise, { IDatabase } from 'pg-promise';
import {
  createTransactionRunner,
  DbConnectionGetterFn,
  RepositoryHelper,
  TransactionRunnerFn,
} from '@pia/lib-service-core';

const pgp = pgPromise({ capSQL: true });

export const db: IDatabase<unknown> = pgp(config.database);
export const runTransaction: TransactionRunnerFn = createTransactionRunner(db);
export const getDbTransactionFromOptionsOrDbConnection: DbConnectionGetterFn =
  RepositoryHelper.createDbConnectionGetter(db);
