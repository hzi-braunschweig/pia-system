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

import { ToastPresenterService } from '../services/toast-presenter/toast-presenter.service';
import { NetworkService } from '../services/network/network.service';

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
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 401 && error.status !== 403) {
          const message = this.network.isOffline()
            ? 'APP.TOAST_MSG_NO_INTERNET'
            : 'APP.TOAST_MSG_UNKNOWN_ERROR';
          this.toastPresenter.presentToast(message);
        }
        return throwError(error);
      })
    );
  }
}
