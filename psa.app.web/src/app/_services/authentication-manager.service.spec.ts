/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { LoginResponse, User } from '../psa.app.core/models/user';

import { AuthenticationManager } from './authentication-manager.service';
import {
  createLoginResponse,
  createUser,
} from '../psa.app.core/models/instance.helper.spec';
import { first } from 'rxjs/operators';
import createSpy = jasmine.createSpy;
import anything = jasmine.anything;

describe('AuthenticationManager', () => {
  let service: AuthenticationManager;

  beforeEach(async () => {
    // Provider and Services

    // Build Base Module
    TestBed.configureTestingModule({
      providers: [AuthenticationManager],
    });
    service = TestBed.inject(AuthenticationManager);
  });
  afterEach(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('pwChangeNeeded');
    localStorage.removeItem('token_login');
  });

  describe('when not logged in', () => {
    it('should not be authenticated', async () => {
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getToken()).toBeNull();
      expect(service.getCurrentRole()).toBeNull();
      expect(service.getLoginTokenUsername()).toBeNull();
    });

    it('should login and notify all observers', fakeAsync(() => {
      const spy = createSpy();
      service.currentUser$.pipe(first()).subscribe(spy);
      service.handleLoginResponse(createLoginResponse());
      tick();
      expect(spy).toHaveBeenCalled();
    }));
    it('should not return a username', () => {
      expect(service.getCurrentUsername()).toBeNull();
    });
    it('should not return a study', () => {
      expect(service.getCurrentStudy()).toBeNull();
    });
  });

  describe('when logged in', () => {
    let user: User;
    let loginResponse: LoginResponse;

    beforeEach(fakeAsync(() => {
      user = createUser({
        username: 'TEST-0001',
        role: 'Proband',
        studies: ['Teststudy1'],
      });
      loginResponse = createLoginResponse(
        { username: user.username, role: user.role, groups: user.studies },
        { pw_change_needed: true }
      );
      service.handleLoginResponse(loginResponse);
      tick(); // wait for observable to finish notification
    }));

    it('should return the token', () => {
      expect(service.getToken()).toEqual(loginResponse.token);
    });

    it('should be authenticated when someone is logged in', async () => {
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.getCurrentRole()).toEqual('Proband');
      expect(service.getLoginTokenUsername()).toBeDefined();
    });

    it('should approve that the user is authenticated', () => {
      expect(service.isAuthenticated()).toBeTrue();
    });
    it('should return true', () => {
      expect(service.isPasswordChangeNeeded()).toBeTrue();
    });
    it('should change the value', () => {
      service.setPasswordChangeNeeded(false);
      expect(service.isPasswordChangeNeeded()).toBeFalse();
    });
    it('should return the username from the token', () => {
      expect(service.getCurrentUsername()).toEqual(user.username);
    });
    it('should return the only study of a proband from the token', () => {
      expect(service.getCurrentStudy()).toEqual(user.studies[0]);
    });
    it('should return the login token from the loginResponse', () => {
      expect(service.getLoginToken()).toEqual(loginResponse.token_login);
    });

    it('should remove the login token', () => {
      service.removeLoginToken();
      expect(localStorage.getItem('token_login')).toBeNull();
      expect(service.getLoginToken()).toBeNull();
    });
  });

  describe('when logged in as non proband', () => {
    let user: User;
    let loginResponse: LoginResponse;

    beforeEach(fakeAsync(() => {
      user = createUser({
        username: 'TEST-0001',
        role: 'Forscher',
        studies: ['Teststudy1', 'Teststudy2'],
      });
      loginResponse = createLoginResponse(
        { username: user.username, role: user.role, groups: user.studies },
        { pw_change_needed: true }
      );
      service.handleLoginResponse(loginResponse);
      tick(); // wait for observable to finish notification
    }));

    it('should throw an error if trying to get the only current study', () => {
      let threwAnError = false;
      try {
        service.getCurrentStudy();
      } catch (e) {
        threwAnError = true;
      }
      expect(threwAnError).toBeTrue();
    });
  });

  describe('logout', () => {
    let user: User;
    let loginResponse: LoginResponse;
    beforeEach(fakeAsync(() => {
      user = createUser({
        username: 'TEST-0001',
        role: 'Proband',
        studies: ['Teststudy1'],
      });
      loginResponse = createLoginResponse(
        { username: user.username, role: user.role, groups: user.studies },
        { pw_change_needed: true }
      );
      service.handleLoginResponse(loginResponse);
      tick(); // wait for observable to finish notification
    }));

    it('should be able to logout', fakeAsync(() => {
      const users: (User | null)[] = [];
      service.currentUser$.subscribe((nextUser) => {
        users.push(nextUser);
      });
      expect(service.isAuthenticated()).toBe(true);
      const currentUsername = service.getCurrentUsername();
      expect(currentUsername).toBeDefined();
      expect(currentUsername).not.toBeNull();

      service.logout();
      tick();
      expect(service.isAuthenticated()).toBe(false);
      expect(users).toEqual([anything(), null]);
      expect(users[0].username).toEqual(currentUsername);
    }));

    it('should remove token from local storage', fakeAsync(() => {
      localStorage.setItem('token', 'sometoken');
      service.logout();
      tick();
      expect(localStorage.getItem('token')).toBeNull();
    }));
  });
});
