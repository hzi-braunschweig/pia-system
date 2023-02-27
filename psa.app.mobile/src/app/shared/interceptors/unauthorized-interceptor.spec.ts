/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { onErrorResumeNext, Subject } from 'rxjs';

import { UnauthorizedInterceptor } from './unauthorized-interceptor';
import { AuthService } from '../../auth/auth.service';
import SpyObj = jasmine.SpyObj;

describe('UnauthorizedInterceptor', () => {
  let request: HttpRequest<any>;
  let handler: SpyObj<HttpHandler>;
  let handleSubject: Subject<HttpEvent<any>>;
  let authMock: SpyObj<AuthService>;

  beforeEach(() => {
    request = new HttpRequest('GET', 'some/url/');
    handler = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
    handleSubject = new Subject<HttpEvent<any>>();
    handler.handle.and.returnValue(handleSubject.asObservable());
    authMock = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
  });

  it('should log user out if a 401 response was received', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 401 });
    const interceptor = new UnauthorizedInterceptor(authMock);
    onErrorResumeNext(interceptor.intercept(request, handler)).subscribe();
    handleSubject.error(error);
    tick();

    expect(handler.handle).toHaveBeenCalledWith(request);
    expect(authMock.logout).toHaveBeenCalledTimes(1);
  }));

  it('should only pass the error if a non 401 response was received', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 404 });
    const interceptor = new UnauthorizedInterceptor(authMock);
    onErrorResumeNext(interceptor.intercept(request, handler)).subscribe();
    handleSubject.error(error);
    tick();

    expect(handler.handle).toHaveBeenCalledWith(request);
    expect(authMock.logout).not.toHaveBeenCalled();
  }));
});
