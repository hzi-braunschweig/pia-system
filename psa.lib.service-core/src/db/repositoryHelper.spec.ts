/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { IDatabase, ITask } from 'pg-promise';
import { mock } from 'ts-mockito';

import {
  DbConnectionGetterFn,
  RepositoryHelper,
  RepositoryOptions,
} from './repositoryHelper';

describe('RepositoryHelper', () => {
  let db: IDatabase<unknown>;
  let getDbTransactionFromOptionsOrDbConnection: DbConnectionGetterFn;

  beforeEach(() => {
    db = mock<IDatabase<unknown>>();
    getDbTransactionFromOptionsOrDbConnection =
      RepositoryHelper.createDbConnectionGetter(db);
  });

  it('should return a function which returns given db connection', () => {
    expect(getDbTransactionFromOptionsOrDbConnection()).to.equal(db);
  });

  it('should return the given db transaction', () => {
    const options: RepositoryOptions = {
      transaction: mock<ITask<unknown>>(),
    };
    expect(getDbTransactionFromOptionsOrDbConnection(options)).to.equal(
      options.transaction
    );
  });
});
