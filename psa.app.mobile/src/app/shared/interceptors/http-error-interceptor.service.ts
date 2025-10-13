/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ToastPresenterService } from '../services/toast-presenter/toast-presenter.service';
import { NetworkService } from '../services/network/network.service';

export const ToastMsgNoInternet = 'APP.TOAST_MSG_NO_INTERNET';
export const ToastMsgUnknownError = 'APP.TOAST_MSG_UNKNOWN_ERROR';

/**
 * Provides global http error handling
 */
export const httpErrorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const network = inject(NetworkService);
  const toastPresenter = inject(ToastPresenterService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 && error.status !== 403) {
        const message = network.isOffline()
          ? ToastMsgNoInternet
          : ToastMsgUnknownError;
        toastPresenter.presentToast(message);
      }
      return throwError(() => error);
    })
  );
};
