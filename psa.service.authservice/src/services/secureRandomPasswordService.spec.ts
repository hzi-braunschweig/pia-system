/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';

import { SecureRandomPasswordService } from './secureRandomPasswordService';

const expect = chai.expect;

describe('SecureRandomPasswordService', () => {
  describe('generate()', () => {
    const TRIES_COUNT = 10000;
    const TIMEOUT = 30000;

    it('should create a password that meets the regex for 10k tries', () => {
      const expectedLength = 10;
      for (let i = 0; i < TRIES_COUNT; i++) {
        const pw = SecureRandomPasswordService.generate();
        expect(pw).to.be.a('string');
        expect(/.*[0-9].*/.test(pw)).to.be.true;
        expect(/.*[a-z].*/.test(pw)).to.be.true;
        expect(/.*[A-Z].*/.test(pw)).to.be.true;
        expect(/.*[-?*!()&:=/#+%].*/.test(pw)).to.be.true;
        expect(/.*["'^`´IloO0[\]|$.;<>@_{}].*/.test(pw)).to.be.false;
        expect(pw).to.not.include('~');
        expect(pw).to.have.lengthOf(expectedLength);
      }
    }).timeout(TIMEOUT);
  });
});
