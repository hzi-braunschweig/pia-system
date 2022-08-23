/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';

import { AuthTokenMockBuilder } from './authTokenMockBuilder';

describe('AuthTokenMockBuilder', () => {
  it('should create a token mock', () => {
    const token = AuthTokenMockBuilder.createToken({
      username: 'qtest-pm',
      roles: ['ProbandenManager'],
      studies: ['Teststudy'],
    });
    expect(token.startsWith('Bearer')).to.be.true;
  });

  it('should throw if username contains upper case letters', () => {
    expect(() =>
      AuthTokenMockBuilder.createToken({
        username: 'QTest-PM',
        roles: ['ProbandenManager'],
        studies: ['Teststudy'],
      })
    ).to.throw('tokens cannot contain usernames in upper case: "QTest-PM"');
  });
});
