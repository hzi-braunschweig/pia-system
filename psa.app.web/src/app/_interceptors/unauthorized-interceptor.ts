/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthenticationManager } from '../_services/authentication-manager.service';

/**
 * Logs user out and navigates back to login if backend returns unauthorized error
 */
@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {
  constructor(private router: Router, private auth: AuthenticationManager) {}

  public intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.auth.getToken() !== null) {
          const url = this.router.url;
          this.auth.logout();
          if (!url.includes('returnUrl')) {
            this.router.navigate(['login'], {
              queryParams: { returnUrl: url },
            });
          }
        }
        return throwError(error);
      })
    );
  }
}
