/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from './auth.service';

/**
 * This Guard checks whether a user is authenticated. If not the user will be redirected to login.
 * If a new password is needed, the user will be redirected to the change password page.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): true | UrlTree {
    if (!this.auth.isAuthenticated()) {
      return this.router.createUrlTree(['auth', 'login']);
    }
    if (this.auth.isPasswordChangeNeeded()) {
      return this.router.createUrlTree(['auth', 'change-password'], {
        queryParams: {
          isUserIntent: false,
          returnTo: next.url.map((segment) => segment.path),
        },
      });
    }
    return true;
  }
}
