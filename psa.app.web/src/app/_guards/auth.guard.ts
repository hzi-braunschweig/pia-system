/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateFn,
  UrlTree,
} from '@angular/router';
import { createAuthGuard, AuthGuardData } from 'keycloak-angular';
import { environment } from '../../environments/environment';

export const isAccessAllowed = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean | UrlTree> => {
  const { authenticated, grantedRoles, keycloak } = authData;

  // Force the user to log in if currently unauthenticated.
  if (!authenticated) {
    await keycloak.login({
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
  return authorizedRoles.some((role) => grantedRoles.realmRoles.includes(role));
};

export const canActivateAuthRole: CanActivateFn =
  createAuthGuard(isAccessAllowed);
