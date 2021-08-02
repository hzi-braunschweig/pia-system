/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { IBaseProtocol, IDatabase, ITask } from 'pg-promise';

/**
 * Options which may be passed to repository methods in order
 * to execute db queries within the given db transaction
 */
export interface RepositoryOptions {
  transaction?: ITask<unknown>;
}

/**
 * Resolves a pg-promise transaction if present in RepositoryOptions
 * or returns the default db connection
 */
export interface DbConnectionGetterFn {
  (options?: RepositoryOptions | null): IBaseProtocol<unknown>;
}

export class RepositoryHelper {
  /**
   * Factory function which expects a db connection and returns a DbConnectionGetterFn
   */
  public static createDbConnectionGetter(
    db: IDatabase<unknown>
  ): DbConnectionGetterFn {
    return (options?: RepositoryOptions | null): IBaseProtocol<unknown> => {
      if (options?.transaction) {
        return options.transaction;
      } else {
        return db;
      }
    };
  }
}
