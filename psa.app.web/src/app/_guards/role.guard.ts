/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthenticationManager } from '../_services/authentication-manager.service';

/**
 * This guard checks whether the current user's role is one of the expected roles, defined in the route.
 * This guard must be combined with the AuthGuard, because it cannot read a role, if no user is logged in.
 */
@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthenticationManager) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const currentRole = this.auth.getCurrentRole();
    return (
      next.data.expectedRoles && next.data.expectedRoles.includes(currentRole)
    );
  }
}
