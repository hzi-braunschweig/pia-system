/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import sinon from 'sinon';
import JWT from 'jsonwebtoken';
import { config } from '../config';
import { JwtService } from './jwtService';
import {
  ACCESS_TOKEN_ID,
  AccessToken,
  ConfigUtils,
  LOGIN_TOKEN_ID,
  LoginToken,
} from '@pia/lib-service-core';
import { db } from '../db';

const sandbox = sinon.createSandbox();

const expect = chai.expect;

interface CustomTestToken extends AccessToken {
  app: string;
}

const user = { study: 'userStudy' };
const studies = ['researcherStudy1', 'researcherStudy2'];
const locale = 'EN-en';
const username = 'testuser';

describe('JwtService', () => {
  beforeEach(() => {
    sandbox
      .stub(db, 'manyOrNone')
      .resolves(studies.map((study) => ({ study_id: study })));
    sandbox.stub(db, 'one').resolves(user);

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

  it('should createAccessToken for Proband', async () => {
    const role = 'Proband';

    const token = await JwtService.createAccessToken({
      locale,
      role,
      username,
    });
    const decoded = JWT.verify(token, config.publicAuthKey) as CustomTestToken;

    expect(!!decoded).to.be.true;
    expect(decoded.id).to.equal(ACCESS_TOKEN_ID);
    expect(decoded.role).to.equal(role);
    expect(decoded.username).to.equal(username);
    expect(decoded.groups).to.deep.equal([user.study]);
  });

  it('should createAccessToken for Forscher', async () => {
    const role = 'Forscher';

    const token = await JwtService.createAccessToken({
      locale,
      role,
      username,
    });
    const decoded = JWT.verify(token, config.publicAuthKey) as CustomTestToken;

    expect(!!decoded).to.be.true;
    expect(decoded.id).to.equal(ACCESS_TOKEN_ID);
    expect(decoded.role).to.equal(role);
    expect(decoded.username).to.equal(username);
    expect(decoded.groups).to.deep.equal(studies);
  });

  it('should createLoginToken', () => {
    const token = JwtService.createLoginToken({
      username,
    });
    const decoded = JWT.verify(token, config.publicAuthKey) as LoginToken;

    expect(!!decoded).to.be.true;
    expect(decoded.id).to.equal(LOGIN_TOKEN_ID);
    expect(decoded.username).to.equal(username);
  });
});
