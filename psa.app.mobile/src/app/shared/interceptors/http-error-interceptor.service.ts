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
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ToastPresenterService } from '../services/toast-presenter/toast-presenter.service';
import { NetworkService } from '../services/network/network.service';

export const ToastMsgNoInternet = 'APP.TOAST_MSG_NO_INTERNET';
export const ToastMsgUnknownError = 'APP.TOAST_MSG_UNKNOWN_ERROR';

// Header to signal HttpErrorInterceptor to suppress error toast for requests. Is removed before sending request.
export const NoErrorToastHeader = 'x-pia-no-error-toast';

/**
 * Provides global http error handling
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private network: NetworkService,
    private toastPresenter: ToastPresenterService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const allowErrorToast = this.allowErrorToast(request);
    request = this.cleanUpHeaders(request);

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (allowErrorToast && error.status !== 401 && error.status !== 403) {
          const message = this.network.isOffline()
            ? ToastMsgNoInternet
            : ToastMsgUnknownError;
          this.toastPresenter.presentToast(message);
        }
        return throwError(error);
      })
    );
  }

  private allowErrorToast(request: HttpRequest<any>): boolean {
    return !request.headers.has(NoErrorToastHeader);
  }

  private cleanUpHeaders(request: HttpRequest<any>): HttpRequest<any> {
    if (request.headers.keys().length === 0) {
      return request;
    }

    return request.clone({
      headers: this.cloneHttpHeader(request.headers, [NoErrorToastHeader]),
    });
  }

  private cloneHttpHeader(from: HttpHeaders, omitKeys: string[]): HttpHeaders {
    const headers: Record<string, string> = {};
    const allowedKeys = from.keys().filter((key) => !omitKeys.includes(key));

    for (const key of allowedKeys) {
      headers[key] = from.get(key);
    }

    return new HttpHeaders(headers);
  }
}
