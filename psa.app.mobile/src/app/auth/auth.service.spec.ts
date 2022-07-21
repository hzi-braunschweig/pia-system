/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { AuthService } from './auth.service';
import {
  createKeycloakToken,
  createLegacyLoginResponse,
} from './auth.model.spec';
import { LoginResponse, User } from './auth.model';
import { DOCUMENT } from '@angular/common';
import { KeycloakTokenParsed } from 'keycloak-js';
import { HandlePasswordChangeNotAllowedError } from './errors/handle-password-change-not-allowed-error';
import { InvalidTokenError } from './errors/invalid-token-error';

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

  describe('throw error on invalid token', () => {
    it('should throw an error when token no role or studies property', () => {
      expect(() => {
        const { token } = createKeycloakToken({}, ['studies']);
        service.handleKeycloakToken(token);
      }).toThrow(new InvalidTokenError());

      expect(() => {
        // roles are beneath the property 'realm_access'
        const { token } = createKeycloakToken({}, ['realm_access']);
        service.handleKeycloakToken(token);
      }).toThrow(new InvalidTokenError());
    });
  });

  describe('when not logged in', () => {
    it('should login with keycloak token', (done) => {
      const { token, payload } = createKeycloakToken();
      service.handleKeycloakToken(token);

      expect(service.getToken()).toEqual(token);

      service.currentUser$.subscribe((user) => {
        expect(user.username).toEqual(payload.username);
        expect(service.isLegacyLogin()).toBeFalse();
        done();
      });
    });

    it('should login with legacy login response', (done) => {
      const payloadOverride = {
        username: 'fake-username',
      };
      const response = createLegacyLoginResponse(payloadOverride);

      service.handleLegacyLoginResponse(response);

      expect(service.getToken()).toEqual(response.token);

      service.currentUser$.subscribe((user) => {
        expect(user.username).toEqual(payloadOverride.username);
        expect(service.isLegacyLogin()).toBeTrue();
        done();
      });
    });

    it('should return null when asking for token or properties', () => {
      expect(service.getToken()).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
      expect(service.getRememberedUsername()).toBeNull();
    });
  });

  it('should remove the token and the pwChangeNeeded from localstorage so that the user is not logged in anymore', () => {
    service.handleKeycloakToken(createKeycloakToken().token);
    service.resetCurrentUser();
    expect(localStorage.getItem('token')).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getToken()).toBeNull();
    expect(service.isPasswordChangeNeeded()).toBeNull();
  });

  it('should remove the login token', () => {
    service.setRememberedUsername('dummy');
    service.removeRememberedUsername();
    expect(localStorage.getItem('remembered_username')).toBeNull();
    expect(service.getRememberedUsername()).toBeNull();
  });

  describe('login keycloak', () => {
    let user: User;
    let token: string;
    let payload: KeycloakTokenParsed;

    beforeEach(fakeAsync(() => {
      user = { username: 'TEST-0001', role: 'Proband', study: 'test_study' };
      ({ token, payload } = createKeycloakToken(user));
      service.handleKeycloakToken(token);
      tick(); // wait for observable to finish notification
    }));

    it('should return the token', () => {
      expect(service.getToken()).toEqual(token);
    });
    it('should approve that the user is authenticated', () => {
      expect(service.isAuthenticated()).toBeTrue();
    });
    it('should return false for password change is needed', () => {
      expect(service.isPasswordChangeNeeded()).toBeNull();
    });
    it('should not allow to change the value for password change is needed', () => {
      expect(() => service.setPasswordChangeNeeded(true)).toThrow(
        new HandlePasswordChangeNotAllowedError()
      );
    });
    it('should return the user from the token', () => {
      expect(service.getCurrentUser()).toEqual(user);
    });
  });

  describe('login legacy', () => {
    let user: User;
    let loginResponse: LoginResponse;

    beforeEach(fakeAsync(() => {
      user = { username: 'TEST-0001', role: 'Proband', study: 'teststudy' };
      loginResponse = createLegacyLoginResponse(
        { username: user.username, role: user.role, groups: [user.study] },
        { pw_change_needed: true }
      );
      service.handleLegacyLoginResponse(loginResponse);
      tick(); // wait for observable to finish notification
    }));

    it('should return the token', () => {
      expect(service.getToken()).toEqual(loginResponse.token);
    });
    it('should approve that the user is authenticated', () => {
      expect(service.isAuthenticated()).toBeTrue();
    });
    it('should return current status if password  change is needed', () => {
      expect(service.isPasswordChangeNeeded()).toBeTrue();
    });
    it('should change the value if password change is needed', () => {
      service.setPasswordChangeNeeded(false);
      expect(service.isPasswordChangeNeeded()).toBeFalse();
    });
    it('should return the user from the token', () => {
      expect(service.getCurrentUser()).toEqual(user);
    });
  });

  describe('logout', () => {
    for (let legacy of [true, false]) {
      describe(legacy ? 'legacy' : 'keycloak', () => {
        let user: User;
        let loginResponse: LoginResponse;

        beforeEach(fakeAsync(() => {
          user = {
            username: 'TEST-0001',
            role: 'Proband',
            study: 'teststudy',
          };

          if (legacy) {
            loginResponse = createLegacyLoginResponse(
              {
                username: user.username,
                role: user.role,
                groups: [user.study],
              },
              { pw_change_needed: true }
            );
            service.handleLegacyLoginResponse(loginResponse);
          } else {
            const { token } = createKeycloakToken(user);
            service.handleKeycloakToken(token);
          }
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
    }
  });
});
