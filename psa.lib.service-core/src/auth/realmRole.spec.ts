/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { getPrimaryRealmRole, getRealmRoles, hasRealmRole } from './realmRole';
import { AccessToken } from './authModel';

describe('realm role', () => {
  describe('hasRealmRole()', () => {
    it('should throw if scope is undefined', () => {
      expect(() => hasRealmRole('SysAdmin', createDecodedToken(undefined))).to
        .throw;
    });

    it('should return false if scope is empty', () => {
      expect(hasRealmRole('SysAdmin', createDecodedToken())).to.be.false;
    });

    it('should return false if expected role is not part of scope', () => {
      expect(
        hasRealmRole('SysAdmin', createDecodedToken(['realm:ProbandenManager']))
      ).to.be.false;
    });

    it('should return true if expected role is part of scope', () => {
      expect(
        hasRealmRole(
          'ProbandenManager',
          createDecodedToken(['realm:ProbandenManager'])
        )
      ).to.be.true;
    });
  });

  describe('getRealmRole()', () => {
    it('should throw if scope is undefined', () => {
      expect(() => getRealmRoles(createDecodedToken(undefined))).to.throw;
    });

    it('should return the realm role', () => {
      expect(getRealmRoles(createDecodedToken(['realm:SysAdmin']))).to.eql([
        'SysAdmin',
      ]);
    });

    it('should return all realm roles', () => {
      expect(
        getRealmRoles(
          createDecodedToken(['realm:Forscher', 'realm:Forscher-admin'])
        )
      ).to.eql(['Forscher', 'Forscher-admin']);
    });
  });

  describe('getPrimaryRealmRole()', () => {
    it('should throw if scope is undefined', () => {
      expect(() => getPrimaryRealmRole(createDecodedToken(undefined))).to.throw;
    });

    it('should only return the primary realm role', () => {
      expect(
        getPrimaryRealmRole(
          createDecodedToken([
            'feature:someCoolThing',
            'realm:Forscher',
            'realm:Forscher-admin',
          ])
        )
      ).to.eql('Forscher');
    });
  });

  function createDecodedToken(scope: string[] = []): AccessToken {
    return {
      username: 'Testuser',
      studies: [],
      locale: 'en-US',
      scope,
    };
  }
});
