/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { isAccessAllowed } from './auth.guard';
import { AuthGuardData } from 'keycloak-angular';
import { TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';
import SpyObj = jasmine.SpyObj;
import { environment } from '../../environments/environment';

describe('isAccessAllowed', () => {
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;
  let keycloak: SpyObj<Keycloak>;

  beforeEach(() => {
    route = new ActivatedRouteSnapshot();
    state = { url: '/some/path' } as RouterStateSnapshot;

    keycloak = jasmine.createSpyObj('Keycloak', ['login']);

    TestBed.configureTestingModule({
      providers: [{ provide: Keycloak, useValue: keycloak }],
    });
  });

  it('should call login and return false if not authenticated', async () => {
    const authData: AuthGuardData = {
      authenticated: false,
      grantedRoles: {
        realmRoles: [],
        resourceRoles: {},
      },
      keycloak,
    };

    const result = await TestBed.runInInjectionContext(() =>
      isAccessAllowed(route, state, authData)
    );

    expect(result).toBeFalse();
    expect(keycloak.login).toHaveBeenCalledOnceWith({
      redirectUri: environment.baseUrl + '/some/path',
    });
  });

  it('should return true if no roles are required', async () => {
    const authData: AuthGuardData = {
      authenticated: true,
      grantedRoles: {
        realmRoles: ['Untersuchungsteam'],
        resourceRoles: {},
      },
      keycloak,
    };
    route.data = {};

    const result = await isAccessAllowed(route, state, authData);

    expect(result).toBeTrue();
  });

  it('should return true if user has an authorized role', async () => {
    const authData: AuthGuardData = {
      authenticated: true,
      grantedRoles: {
        realmRoles: ['Untersuchungsteam'],
        resourceRoles: {},
      },
      keycloak,
    };
    route.data = { authorizedRoles: ['Forscher', 'Untersuchungsteam'] };

    const result = await isAccessAllowed(route, state, authData);

    expect(result).toBeTrue();
  });

  it('should return false if user has no matching role', async () => {
    const authData: AuthGuardData = {
      authenticated: true,
      grantedRoles: {
        realmRoles: ['Proband'],
        resourceRoles: {},
      },
      keycloak,
    };
    route.data = { authorizedRoles: ['Forscher', 'Untersuchungsteam'] };

    const result = await isAccessAllowed(route, state, authData);

    expect(result).toBeFalse();
  });
});
