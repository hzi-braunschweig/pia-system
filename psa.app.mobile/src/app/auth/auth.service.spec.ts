/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { createLoginResponse } from './auth.model.spec';
import { LoginResponse, User } from './auth.model';
import { DOCUMENT } from '@angular/common';
import createSpy = jasmine.createSpy;
import anything = jasmine.anything;

describe('AuthService', () => {
  let service: AuthService;
  let document;

  beforeEach(async () => {
    // Provider and Services
    document = {
      defaultView: { location: { href: '/not/root' } },
    };

    // Build Base Module
    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false }, // is needed due to document mock
      providers: [
        {
          provide: DOCUMENT,
          useValue: document,
        },
      ],
    });
    service = TestBed.inject(AuthService);
  });
  afterEach(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('pwChangeNeeded');
    localStorage.removeItem('token_login');
    localStorage.removeItem('remembered_username');
  });

  describe('when not logged in', () => {
    it('should login and notify all observers', fakeAsync(() => {
      const spy = createSpy();
      service.currentUser$.subscribe(spy);
      expect(spy).toHaveBeenCalledOnceWith(null);

      service.handleLoginResponse(createLoginResponse());
      tick();
      expect(spy).toHaveBeenCalledWith(anything());
    }));

    it('should return null when asking for token or properties', () => {
      expect(service.getToken()).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
      expect(service.getRememberedUsername()).toBeNull();
    });
  });

  describe('when logged in', () => {
    let user: User;
    let loginResponse: LoginResponse;

    beforeEach(fakeAsync(() => {
      user = { username: 'TEST-0001', role: 'Proband', study: 'teststudy' };
      loginResponse = createLoginResponse(
        { username: user.username, role: user.role, groups: [user.study] },
        { pw_change_needed: true }
      );
      service.handleLoginResponse(loginResponse);
      tick(); // wait for observable to finish notification
    }));

    it('should return the token', () => {
      expect(service.getToken()).toEqual(loginResponse.token);
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
    it('should return the user from the token', () => {
      expect(service.getCurrentUser()).toEqual(user);
    });
    it('should remove the token and the pwChangeNeeded from localstorage so that the user is not logged in anymore', () => {
      service.resetCurrentUser();
      expect(localStorage.getItem('token')).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getToken()).toBeNull();
      expect(service.isPasswordChangeNeeded()).toBeNull();
    });
    it('should remove the login token', () => {
      service.removeRememberedUsername();
      expect(localStorage.getItem('remembered_username')).toBeNull();
      expect(service.getRememberedUsername()).toBeNull();
    });
  });

  describe('logout', () => {
    let user: User;
    let loginResponse: LoginResponse;
    beforeEach(fakeAsync(() => {
      user = { username: 'TEST-0001', role: 'Proband', study: 'teststudy' };
      loginResponse = createLoginResponse(
        { username: user.username, role: user.role, groups: [user.study] },
        { pw_change_needed: true }
      );
      service.handleLoginResponse(loginResponse);
      tick(); // wait for observable to finish notification
    }));

    it('should call the onBeforeLogout callback', fakeAsync(() => {
      const callbackSpy = jasmine.createSpy().and.resolveTo();
      service.onBeforeLogout(callbackSpy);
      service.logout();
      tick();
      expect(callbackSpy).toHaveBeenCalledTimes(1);
    }));

    it('should remove token from local storage', fakeAsync(() => {
      localStorage.setItem('token', 'sometoken');
      service.logout();
      tick();
      expect(localStorage.getItem('token')).toBeNull();
    }));

    it('should reload the whole app', fakeAsync(() => {
      expect(document.defaultView.location.href).toEqual('/not/root');
      service.logout();
      tick();
      expect(document.defaultView.location.href).toEqual('/');
    }));
  });
});
