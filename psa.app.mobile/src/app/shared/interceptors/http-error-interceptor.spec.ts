/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs/internal/observable/of';
import { throwError } from 'rxjs';

import {
  httpErrorInterceptor,
  ToastMsgNoInternet,
  ToastMsgUnknownError,
} from './http-error-interceptor.service';
import { NetworkService } from '../services/network/network.service';
import { ToastPresenterService } from '../services/toast-presenter/toast-presenter.service';
import SpyObj = jasmine.SpyObj;

describe('httpErrorInterceptor', () => {
  let networkSpy: SpyObj<NetworkService>;
  let toastPresenterSpy: SpyObj<ToastPresenterService>;
  let next: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    networkSpy = jasmine.createSpyObj<NetworkService>('NetworkService', [
      'isOffline',
    ]);
    toastPresenterSpy = jasmine.createSpyObj<ToastPresenterService>(
      'ToastPresenterService',
      ['presentToast']
    );

    next = jasmine.createSpy().and.returnValue(of(new HttpResponse()));

    TestBed.configureTestingModule({
      providers: [
        { provide: NetworkService, useValue: networkSpy },
        { provide: ToastPresenterService, useValue: toastPresenterSpy },
      ],
    });
  });

  it('should do nothing when no error occurred', (done) => {
    const request = new HttpRequest('GET', 'some/url/', {
      headers: new HttpHeaders(),
    });

    TestBed.runInInjectionContext(() => {
      httpErrorInterceptor(request, next).subscribe(() => {
        expect(next).toHaveBeenCalledWith(request);
        expect(toastPresenterSpy.presentToast).not.toHaveBeenCalled();
        done();
      });
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

        const error = new HttpErrorResponse({
          status: errorCode,
          url: request.url,
          error: 'fake error message',
        });

        next.and.returnValue(throwError(() => error));

        TestBed.runInInjectionContext(() => {
          httpErrorInterceptor(request, next).subscribe({
            error: (e) => {
              expect(next).toHaveBeenCalledWith(request);
              expect(toastPresenterSpy.presentToast).toHaveBeenCalledWith(
                expectedErrormessage
              );
              expect(e).toEqual(error);
              done();
            },
          });
        });
      });
    }
  }

  for (const errorCode of [401, 403]) {
    it(`should not present toast on error code ${errorCode}`, (done) => {
      const request = new HttpRequest('GET', 'some/url/', {
        headers: new HttpHeaders(),
      });

      const error = new HttpErrorResponse({
        status: errorCode,
        url: request.url,
        error: 'fake error message',
      });

      next.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        httpErrorInterceptor(request, next).subscribe({
          error: (e) => {
            expect(next).toHaveBeenCalledWith(request);
            expect(toastPresenterSpy.presentToast).not.toHaveBeenCalled();
            expect(e).toEqual(error);
            done();
          },
        });
      });
    });
  }
});
