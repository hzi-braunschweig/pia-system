import chai from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { IDatabase } from 'pg-promise';
import { mock } from 'ts-mockito';

import { validateAccessToken } from './validateAccessToken';
import { AccessToken, TokenValidationFn } from '../authModel';

const expect = chai.expect;
chai.use(sinonChai);

describe('validateAccessToken()', () => {
  let validate: TokenValidationFn<AccessToken>;

  before(() => {
    validate = validateAccessToken();
  });

  it('should return false if no valid AccessToken was passed', async () => {
    const result = await validate({
      // Ignore in order to simulate malicious payload
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      id: 2,
      username: 'Testuser',
      thisMayNotExist: true,
    });
    expect(result.isValid).to.be.false;
  });

  it('should return true if no database connection exists', async () => {
    const result = await validate({
      id: 1,
      username: 'Testuser',
      role: 'Proband',
      groups: [],
    });
    expect(result.isValid).to.be.true;
  });

  it('should check that the user exists in the DB and is not deactivated', async () => {
    const db: IDatabase<unknown> = mock<IDatabase<unknown>>();
    db.oneOrNone = sinon.stub().resolves({ test: 'string' });
    validate = validateAccessToken(db);

    const result = await validate({
      id: 1,
      username: 'Testuser',
      role: 'Proband',
      groups: [],
    });
    expect((db.oneOrNone as sinon.SinonStub).calledOnce).to.be.ok;
    expect(
      (db.oneOrNone as sinon.SinonStub).calledWith(
        "SELECT username FROM users WHERE username=${username} AND role=${role} AND account_status!='deactivated'",
        { username: 'Testuser', role: 'Proband' }
      )
    ).to.be.ok;
    expect(result.isValid).to.be.true;
  });

  it('should return false if db throws an error', async () => {
    const db: IDatabase<unknown> = mock<IDatabase<unknown>>();
    db.oneOrNone = sinon.stub().rejects(new Error('user does not exist'));
    validate = validateAccessToken(db);

    const result = await validate({
      id: 1,
      username: 'Testuser',
      role: 'Proband',
      groups: [],
    });
    expect((db.oneOrNone as sinon.SinonStub).calledOnce).to.be.ok;
    expect(result.isValid).to.be.false;
  });
});
