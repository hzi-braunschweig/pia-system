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
  UrlTree,
} from '@angular/router';
import { AuthService } from './auth.service';

/**
 * This Guard checks whether a user is authenticated. If not the user will be redirected to login.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  public canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): true | UrlTree {
    if (this.auth.isAuthenticated()) {
      return true;
    } else {
      console.warn('AuthGuard: User is not authenticated');
      return this.router.createUrlTree(['auth', 'login']);
    }
  }
}
