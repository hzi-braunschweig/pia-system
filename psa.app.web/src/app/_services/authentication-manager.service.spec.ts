/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { User } from '../psa.app.core/models/user';

import { AuthenticationManager } from './authentication-manager.service';

describe('AuthenticationManager', () => {
  let service: AuthenticationManager;

  const user: User = {
    username: '',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiUHJvYmFuZCJ9.B45TTcR1tYp1G3aTyZXHdYnb1BLwW8OqvQJuRz6QYNU',
    role: 'Proband',
    first_logged_in_at: '',
    compliance_labresults: false,
    compliance_samples: false,
    compliance_bloodsamples: false,
    study_center: '',
    examination_wave: 0,
    ids: null,
    needs_material: false,
    pw_change_needed: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthenticationManager],
    });
    service = TestBed.inject(AuthenticationManager);
  });

  it('should not be authenticated when nobody is logged in', async () => {
    service.currentUser = null;

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentRole).toBeNull();
    expect(service.currentUser).toBeNull();
    expect(service.loginTokenPayload).toBeNull();
  });

  it('should be authenticated when someone is logged in', async () => {
    service.currentUser = user;

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentRole).toEqual('Proband');
    expect(service.currentUser).toBeDefined();
    expect(service.loginTokenPayload).toBeDefined();
  });

  it('should be able to logout', async () => {
    service.currentUser = null;

    const users: (User | null)[] = [];
    service.currentUserObservable.subscribe((currentUser) => {
      users.push(currentUser);
    });

    service.currentUser = user;
    expect(service.isAuthenticated()).toBe(true);

    await service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(users).toEqual([null, user, null]);
  });
});
