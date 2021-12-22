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
import { AuthenticationManager } from '../_services/authentication-manager.service';
import { AlertService } from '../_services/alert.service';

/**
 * This Guard checks whether a user is authenticated. If not he will be redirected to login.
 * If he needs a new password, he will be redirected to the change password page.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private auth: AuthenticationManager,
    private alertService: AlertService
  ) {}

  public canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (this.auth.isAuthenticated()) {
      if (this.auth.isPasswordChangeNeeded()) {
        return this.router.createUrlTree(['/changePassword']);
      }
      return true;
    } else if (this.auth.getToken()) {
      // only show this error, if the user was logged in
      this.alertService.errorMessage('ERROR.ERROR_TOKEN_EXPIRED', {
        keepAfterNavigation: true,
      });
    }
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }
}
