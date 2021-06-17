import chai from 'chai';
import sinon from 'sinon';
import JWT from 'jsonwebtoken';
import { config } from '../config';
import pgHelper from './postgresqlHelper';
import jwtService from './jwtService';
import {
  ACCESS_TOKEN_ID,
  AccessToken,
  ConfigUtils,
  LOGIN_TOKEN_ID,
  LoginToken,
} from '@pia/lib-service-core';

const sandbox = sinon.createSandbox();

const expect = chai.expect;

interface CustomTestToken extends AccessToken {
  app: string;
}

const studies = ['study1', 'study2'];
const locale = 'EN-en';
const app = 'web';
const role = 'Proband';
const username = 'testuser';

describe('JwtService', () => {
  beforeEach(() => {
    sandbox.stub(pgHelper, 'getUserStudies').resolves(studies);
    sandbox
      .stub(config, 'privateAuthKey')
      .value(ConfigUtils.getFileContent('./tests/unit/private.key'));
    sandbox
      .stub(config, 'publicAuthKey')
      .value(ConfigUtils.getFileContent('./tests/unit/public.pem'));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should createSormasToken', async () => {
    const token = await jwtService.createSormasToken();
    const decoded = JWT.verify(token, config.publicAuthKey) as AccessToken;

    expect(!!decoded).to.be.true;
    expect(decoded.id).to.equal(ACCESS_TOKEN_ID);
    expect(decoded.role).to.equal('ProbandenManager');
    expect(decoded.username).to.equal('sormas-client');
    expect(decoded.groups).to.deep.equal(studies);
  });

  it('should createAccessToken', async () => {
    const token = await jwtService.createAccessToken({
      locale,
      app,
      role,
      username,
    });
    const decoded = JWT.verify(token, config.publicAuthKey) as CustomTestToken;

    expect(!!decoded).to.be.true;
    expect(decoded.id).to.equal(ACCESS_TOKEN_ID);
    expect(decoded.role).to.equal(role);
    expect(decoded.username).to.equal(username);
    expect(decoded.groups).to.deep.equal(studies);
    expect(decoded.app).to.deep.equal(app);
  });

  it('should createLoginToken', () => {
    const token = jwtService.createLoginToken({
      username,
    });
    const decoded = JWT.verify(token, config.publicAuthKey) as LoginToken;

    expect(!!decoded).to.be.true;
    expect(decoded.id).to.equal(LOGIN_TOKEN_ID);
    expect(decoded.username).to.equal(username);
  });
});
