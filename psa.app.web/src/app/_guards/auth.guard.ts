/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard extends KeycloakAuthGuard {
  constructor(
    protected readonly router: Router,
    protected readonly keycloak: KeycloakService
  ) {
    super(router, keycloak);
  }

  public async isAccessAllowed(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    // Force the user to log in if currently unauthenticated.
    if (!this.authenticated) {
      await this.keycloak.login({
        redirectUri: environment.baseUrl + state.url,
      });
      return false;
    }

    // Get the authorized roles from the route.
    const authorizedRoles = route.data?.authorizedRoles;

    // Allow the user to proceed if no additional roles are required to access the route.
    if (!(authorizedRoles instanceof Array) || authorizedRoles.length === 0) {
      return true;
    }

    // Allow the user to proceed if any of the required roles is present.
    return authorizedRoles.some((role) => this.roles.includes(role));
  }
}
