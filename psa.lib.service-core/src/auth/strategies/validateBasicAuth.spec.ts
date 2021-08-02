/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { Request } from '@hapi/hapi';
import sinon from 'sinon';

import { BasicValidationFn } from '../authModel';
import { validateBasicAuth } from './validateBasicAuth';

describe('validateBasicAuth()', () => {
  let validate: BasicValidationFn;
  let clock: sinon.SinonFakeTimers;

  before(() => {
    clock = sinon.useFakeTimers();
    validate = validateBasicAuth('testuser', 'testpw');
  });

  after(() => {
    clock.restore();
  });

  it('should return false if invalid credentials were passed', () => {
    expect(validate(createRequest(), 'I_have_no_access', 'passw0rd').isValid).to
      .be.false;
  });

  it('should return true if valid credentials were passed', () => {
    expect(validate(createRequest(), 'testuser', 'testpw').isValid).to.be.true;
  });

  it('should throw if 3 attempts were not successful for the same IP', () => {
    const DELAY_WITHIN_BAN_THRESHOLD = 290000;
    const DELAY_OUT_OF_BAN_THRESHOLD = 310000;
    const [badUser, badpassword, badIp] = [
      'baduser',
      'badpassword',
      '56.57.58.59',
    ];
    clock.tick(1); // set initial clock > 0
    expect(validate(createRequest(badIp), badUser, badpassword).isValid).to.be
      .false;
    expect(validate(createRequest(badIp), badUser, badpassword).isValid).to.be
      .false;
    expect(validate(createRequest(badIp), badUser, badpassword).isValid).to.be
      .false;
    clock.tick(DELAY_WITHIN_BAN_THRESHOLD);
    expect(() => validate(createRequest(badIp), 'testuser', 'testpw')).to.throw(
      'User has 3 failed login attempts and is banned for 10 seconds'
    );
    clock.tick(DELAY_OUT_OF_BAN_THRESHOLD);
    expect(validate(createRequest(badIp), 'testuser', 'testpw').isValid).to.be
      .true;
  });

  it('should also throw if x-forwarded-for header does not exist', () => {
    const [badUser, badpassword] = ['baduser', 'badpassword'];
    const request: Request = {
      headers: {},
      info: { remoteAddress: '255.89.78.100' },
    } as unknown as Request;
    expect(validate(request, badUser, badpassword).isValid).to.be.false;
    expect(validate(request, badUser, badpassword).isValid).to.be.false;
    expect(validate(request, badUser, badpassword).isValid).to.be.false;
    expect(() => validate(request, 'testuser', 'testpw')).to.throw(
      'User has 3 failed login attempts and is banned for 300 seconds'
    );
  });

  function createRequest(ip = '144.67.224.0,192.168.0.15'): Request {
    return {
      headers: {
        'x-forwarded-for': ip,
      },
      info: {
        remoteAddress: '255.89.78.100',
      },
    } as unknown as Request;
  }
});
