/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let document;

  beforeEach(() => {
    document = {
      defaultView: { location: { href: '/not/root' } },
    };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: document,
        },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('logout', () => {
    it('should call the onBeforeLogout callback', async () => {
      const callbackSpy = jasmine.createSpy().and.resolveTo();
      service.onBeforeLogout(callbackSpy);
      await service.logout();
      expect(callbackSpy).toHaveBeenCalledTimes(1);
    });

    it('should remove token from local storage', async () => {
      localStorage.setItem('currentUser', 'sometoken');
      await service.logout();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });

    it('should reload the whole app', async () => {
      expect(document.defaultView.location.href).toEqual('/not/root');
      await service.logout();
      expect(document.defaultView.location.href).toEqual('/');
    });
  });
});
