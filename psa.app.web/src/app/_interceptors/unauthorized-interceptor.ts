/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import Keycloak from 'keycloak-js';

/**
 * Logs user out and navigates back to login if backend returns unauthorized error
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const keycloak = inject(Keycloak);
  const document = inject(DOCUMENT);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // If the auth session could not be refreshed again, send the user to login
      if (error.status === 401 || keycloak.isTokenExpired()) {
        /**
         * Do a direct logout without calling AuthenticationManager#logout,
         * thus without invalidating the FCM Token. Probands should still
         * receive push notifications.
         */
        keycloak
          .logout({ redirectUri: document.location.href })
          .catch((err) =>
            console.error(
              'Could not logout after unauthorized backend request',
              err
            )
          );
      }
      return throwError(() => error);
    })
  );
};
