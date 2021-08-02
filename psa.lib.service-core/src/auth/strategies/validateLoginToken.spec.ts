/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { IDatabase } from 'pg-promise';
import { mock } from 'ts-mockito';

import { LoginToken, TokenValidationFn } from '../authModel';
import { validateLoginToken } from './validateLoginToken';

const expect = chai.expect;
chai.use(sinonChai);

describe('validateLoginToken()', () => {
  let validate: TokenValidationFn<LoginToken>;
  let db: IDatabase<unknown>;
  let oneOrNoneStub: sinon.SinonStub;

  before(() => {
    db = mock<IDatabase<unknown>>();
    oneOrNoneStub = sinon.stub().resolves({ test: 'string' });
    db.oneOrNone = oneOrNoneStub;
    validate = validateLoginToken(db);
  });

  it('should throw error if validation function is created without db connection', () => {
    expect(() => validateLoginToken({} as unknown as IDatabase<unknown>)).to
      .throw;
  });

  it('should return false if no valid LoginToken was passed', async () => {
    const result = await validate({
      // Ignore in order to simulate malicious payload
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      id: 1,
      username: 'Testuser',
      thisMayNotExist: true,
    });
    expect(result.isValid).to.be.false;
  });

  it('should check that the user exists in the DB and is not deactivated', async () => {
    const result = await validate({
      id: 2,
      username: 'Testuser',
    });
    expect(oneOrNoneStub.calledOnce).to.be.ok;
    expect(
      oneOrNoneStub.calledWith(
        "SELECT username FROM users WHERE username=${username} AND account_status!='deactivated'",
        { username: 'Testuser' }
      )
    ).to.be.ok;
    expect(result.isValid).to.be.true;
  });

  it('should return false if db throws an error', async () => {
    oneOrNoneStub = sinon.stub().rejects(new Error('user does not exist'));
    db.oneOrNone = oneOrNoneStub;
    validate = validateLoginToken(db);

    const result = await validate({
      id: 2,
      username: 'Testuser',
    });
    expect(oneOrNoneStub.calledOnce).to.be.ok;
    expect(result.isValid).to.be.false;
  });
});
