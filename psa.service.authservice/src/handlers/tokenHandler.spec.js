/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const Crypto = require('crypto');
const proxyquire = require('proxyquire');
const spy = require('sinon').spy;

describe('token handler', function () {
  it('should call Crypto to create a random token', async function () {
    const testSpy = spy(Crypto, 'randomBytes');
    const replySpy = spy();
    const tokenHandlerProxy = proxyquire('./tokenHandler', { Crypto });
    await tokenHandlerProxy.requestToken({}, replySpy);
    expect(testSpy.called).to.be.true;
  });
});
