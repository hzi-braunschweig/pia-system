/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { onErrorResumeNext, Subject } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import SpyObj = jasmine.SpyObj;
import { unauthorizedInterceptor } from './unauthorized-interceptor';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('unauthorizedInterceptor', () => {
  let request: HttpRequest<any>;
  let handleSubject: Subject<HttpEvent<any>>;
  let authMock: SpyObj<AuthService>;
  let next: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    authMock = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    authMock.logout.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    request = new HttpRequest('GET', 'some/url/');
    handleSubject = new Subject<HttpEvent<any>>();
    next = jasmine.createSpy().and.returnValue(handleSubject.asObservable());
  });

  it('should log user out if a 401 response was received', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 401 });

    let interceptorResult = undefined;
    TestBed.runInInjectionContext(() => {
      unauthorizedInterceptor(request, next).subscribe({
        error: (err) => {
          interceptorResult = err;
        },
      });
    });

    handleSubject.error(error);
    tick();

    expect(next).toHaveBeenCalledWith(request);
    expect(authMock.logout).toHaveBeenCalledTimes(1);
    expect(interceptorResult).toEqual(error);
  }));

  it('should only pass the error if a non 401 response was received', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 404 });
    onErrorResumeNext(
      TestBed.runInInjectionContext(() =>
        unauthorizedInterceptor(request, next)
      )
    ).subscribe();

    let caughtError: unknown;
    TestBed.runInInjectionContext(() =>
      unauthorizedInterceptor(request, next)
    ).subscribe({
      error: (err) => (caughtError = err),
    });

    handleSubject.error(error);
    tick();

    expect(next).toHaveBeenCalledWith(request);
    expect(authMock.logout).not.toHaveBeenCalled();
    expect(caughtError).toBe(error);
  }));
});
