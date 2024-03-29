/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { IDatabase, ITask } from 'pg-promise';

export interface TransactionRunnerFn {
  <T>(callback: TransactionCallback<T>): Promise<T>;
}

export interface TransactionCallback<T> {
  (transaction: ITask<unknown>): Promise<T>;
}

export function createTransactionRunner(
  db: IDatabase<unknown>
): TransactionRunnerFn {
  return async <T>(callback: TransactionCallback<T>): Promise<T> => {
    return db.tx<T>(async (transaction) => callback(transaction));
  };
}
