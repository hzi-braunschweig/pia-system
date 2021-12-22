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
import { onErrorResumeNext, Subject } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';
import { UnauthorizedInterceptor } from './unauthorized-interceptor';
import { Router } from '@angular/router';
import { AuthenticationManager } from '../_services/authentication-manager.service';
import SpyObj = jasmine.SpyObj;

describe('UnauthorizedInterceptor', () => {
  let request: HttpRequest<unknown>;
  let handler: SpyObj<HttpHandler>;
  let handleSubject: Subject<HttpEvent<unknown>>;
  let router: SpyObj<Router>;
  let auth: SpyObj<AuthenticationManager>;

  beforeEach(() => {
    request = new HttpRequest('GET', 'some/url/');
    handler = jasmine.createSpyObj<SpyObj<HttpHandler>>('HttpHandler', [
      'handle',
    ]);
    handleSubject = new Subject<HttpEvent<unknown>>();
    handler.handle.and.returnValue(handleSubject.asObservable());
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], {
      url: 'http://example.com/',
    });
    auth = jasmine.createSpyObj(AuthenticationManager, ['logout', 'getToken']);
  });

  it('should log user out if a 401 response was received', fakeAsync(async () => {
    const error = new HttpErrorResponse({ status: 401 });
    auth.getToken.and.returnValue('valid token');
    const interceptor = new UnauthorizedInterceptor(router, auth);
    onErrorResumeNext(interceptor.intercept(request, handler)).subscribe();
    handleSubject.error(error);
    tick();
    expect(handler.handle).toHaveBeenCalledWith(request);
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalled();
  }));

  it('should pass the error if a non 401 response was received', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 404 });
    auth.getToken.and.returnValue('valid token');
    const interceptor = new UnauthorizedInterceptor(router, auth);
    onErrorResumeNext(interceptor.intercept(request, handler)).subscribe();
    handleSubject.error(error);
    tick();

    expect(handler.handle).toHaveBeenCalledWith(request);
    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  }));

  it('should pass the error if no user is logged in', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 401 });
    auth.getToken.and.returnValue(null);
    const interceptor = new UnauthorizedInterceptor(router, auth);
    onErrorResumeNext(interceptor.intercept(request, handler)).subscribe();
    handleSubject.error(error);
    tick();

    expect(handler.handle).toHaveBeenCalledWith(request);
    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  }));
});
