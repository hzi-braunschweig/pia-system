/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Inject, Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';
import { DOCUMENT } from '@angular/common';

/**
 * Logs user out and navigates back to login if backend returns unauthorized error
 */
@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly keycloak: KeycloakService
  ) {}

  public intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // If the auth session could not be refreshed again, send the user to login
        if (error.status === 401 || this.keycloak.isTokenExpired()) {
          /**
           * Do a direct logout without calling AuthenticationManager#logout,
           * thus without invalidating the FCM Token. Probands should still
           * receive push notifications.
           */
          this.keycloak
            .logout(this.document.location.href)
            .catch((err) =>
              console.error(
                'Could not logout after unauthorized backend request',
                err
              )
            );
        }
        return throwError(error);
      })
    );
  }
}
