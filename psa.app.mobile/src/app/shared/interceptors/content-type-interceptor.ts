/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Sets Content-Type to application/json by default if none is set
 */
export const contentTypeInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  if (!request.headers.has('Content-Type')) {
    request = request.clone({
      setHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }
  return next(request);
};
