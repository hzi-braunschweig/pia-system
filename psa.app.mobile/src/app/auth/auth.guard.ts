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
} from '@angular/router';
import { AuthService } from './auth.service';
import { KeycloakClientService } from './keycloak-client.service';
import { Platform } from '@ionic/angular';
import { filter, lastValueFrom, take } from 'rxjs';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';

/**
 * This Guard checks whether a user is authenticated. If not the user will be redirected to login.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly keycloakClient: KeycloakClientService,
    private readonly platform: Platform,
    private readonly endpoint: EndpointService
  ) {}

  public async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) {
    if (this.platform.is('hybrid') && !this.endpoint.getUrl()) {
      console.log('AuthGuard: No endpoint configured, redirecting to login');
      return this.router.createUrlTree(['auth', 'login']);
    }

    // Wait for keycloak to be initialized before proceeding
    await lastValueFrom(
      this.keycloakClient.keycloakReady$.pipe(
        filter((ready) => ready),
        take(1)
      )
    );

    if (this.auth.isAuthenticated()) {
      return true;
    } else {
      console.log('AuthGuard: User is not authenticated');

      if (this.platform.is('hybrid')) {
        return this.router.createUrlTree(['auth', 'login']);
      } else {
        await this.keycloakClient.login({
          hidden: false,
          redirectUri: window.location.origin + state.url,
        });
        return false;
      }
    }
  }
}
