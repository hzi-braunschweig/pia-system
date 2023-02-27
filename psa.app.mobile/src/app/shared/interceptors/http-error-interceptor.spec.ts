/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  HttpErrorResponse,
  HttpHandler,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';

import {
  HttpErrorInterceptor,
  ToastMsgNoInternet,
  ToastMsgUnknownError,
} from './http-error-interceptor.service';
import { NetworkService } from '../services/network/network.service';
import { ToastPresenterService } from '../services/toast-presenter/toast-presenter.service';
import { of } from 'rxjs/internal/observable/of';
import { throwError } from 'rxjs';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;

describe('HttpErrorInterceptor', () => {
  let interceptor: HttpErrorInterceptor;
  let networkSpy: SpyObj<NetworkService>;
  let toastPresenterSpy: SpyObj<ToastPresenterService>;
  let handlerSpy: SpyObj<HttpHandler>;

  beforeEach(() => {
    handlerSpy = jasmine.createSpyObj<SpyObj<HttpHandler>>('HttpHandler', [
      'handle',
    ]);

    handlerSpy.handle.and.returnValue(of(new HttpResponse()));

    networkSpy = createSpyObj<NetworkService>('NetworkService', ['isOffline']);
    toastPresenterSpy = createSpyObj<ToastPresenterService>(
      'ToastPresenterService',
      ['presentToast']
    );

    interceptor = new HttpErrorInterceptor(networkSpy, toastPresenterSpy);
  });

  it('should do nothing when no error occurred', (done) => {
    const request = new HttpRequest('GET', 'some/url/', {
      headers: new HttpHeaders(),
    });

    interceptor.intercept(request, handlerSpy).subscribe(() => {
      expect(handlerSpy.handle).toHaveBeenCalledWith(request);
      expect(toastPresenterSpy.presentToast).not.toHaveBeenCalled();
      done();
    });
  });

  for (const errorCode of [404, 500]) {
    for (const networkIsOffline of [true, false]) {
      const expectedErrormessage = networkIsOffline
        ? ToastMsgNoInternet
        : ToastMsgUnknownError;
      const offline = networkIsOffline ? 'offline' : 'online';

      it(`should present toast on error code ${errorCode}, when network is ${offline} with message: ${expectedErrormessage}`, (done) => {
        const request = new HttpRequest('GET', 'some/url/', {
          headers: new HttpHeaders(),
        });

        networkSpy.isOffline.and.returnValue(networkIsOffline);

        let error: HttpErrorResponse;

        handlerSpy.handle.and.callFake((req) => {
          error = new HttpErrorResponse({
            status: errorCode,
            url: req.url,
            error: 'fake error message',
          });
          return throwError(error);
        });

        interceptor.intercept(request, handlerSpy).subscribe({
          error: (e) => {
            expect(handlerSpy.handle).toHaveBeenCalledWith(request);
            expect(toastPresenterSpy.presentToast).toHaveBeenCalledWith(
              expectedErrormessage
            );
            expect(e).toEqual(error);
            done();
          },
        });
      });
    }
  }

  for (const errorCode of [401, 403]) {
    it(`should not present toast on error code ${errorCode}`, (done) => {
      const request = new HttpRequest('GET', 'some/url/', {
        headers: new HttpHeaders(),
      });

      let error: HttpErrorResponse;

      handlerSpy.handle.and.callFake((req) => {
        error = new HttpErrorResponse({
          status: errorCode,
          url: req.url,
          error: 'fake error message',
        });
        return throwError(error);
      });

      interceptor.intercept(request, handlerSpy).subscribe({
        error: (e) => {
          expect(handlerSpy.handle).toHaveBeenCalledWith(request);
          expect(toastPresenterSpy.presentToast).not.toHaveBeenCalled();
          expect(e).toEqual(error);
          done();
        },
      });
    });
  }
});
