/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  HttpErrorResponse,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { onErrorResumeNext, Subject } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';
import { HttpEvent } from '@angular/common/http';
import { UnauthorizedInterceptor } from './unauthorized-interceptor';
import { Router } from '@angular/router';
import { AuthenticationManager } from '../_services/authentication-manager.service';
import SpyObj = jasmine.SpyObj;
import { AlertService } from '../_services/alert.service';

describe('UnauthorizedInterceptor', () => {
  let request: HttpRequest<any>;
  let handler: SpyObj<HttpHandler>;
  let handleSubject: Subject<HttpEvent<any>>;
  let router: SpyObj<Router>;
  let alert: SpyObj<AlertService>;

  beforeEach(() => {
    request = new HttpRequest('GET', 'some/url/');
    handler = jasmine.createSpyObj<SpyObj<HttpHandler>>('HttpHandler', [
      'handle',
    ]);
    handleSubject = new Subject<HttpEvent<any>>();
    handler.handle.and.returnValue(handleSubject.asObservable());
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], {
      url: 'http://example.com/',
    });
    alert = jasmine.createSpyObj<AlertService>('alert', ['errorObject']);
  });

  it('should log user out if a 401 response was received', fakeAsync(async () => {
    const error = new HttpErrorResponse({ status: 401 });
    const auth = jasmine.createSpyObj<AuthenticationManager>('auth', [
      'logout',
    ]);
    auth.logout.and.resolveTo();
    const interceptor = new UnauthorizedInterceptor(router, auth, alert);
    onErrorResumeNext(interceptor.intercept(request, handler)).subscribe();
    handleSubject.error(error);
    tick();
    expect(handler.handle).toHaveBeenCalledWith(request);
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalled();
  }));

  it('should only pass the error if a non 401 response was received', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 404 });
    const auth = { currentUser: {} } as AuthenticationManager;
    const interceptor = new UnauthorizedInterceptor(router, auth, alert);
    onErrorResumeNext(interceptor.intercept(request, handler)).subscribe();
    handleSubject.error(error);
    tick();

    expect(handler.handle).toHaveBeenCalledWith(request);
    expect(auth.currentUser).not.toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  }));

  it('should only pass the error if no user is logged in', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 401 });
    const auth = { currentUser: null } as AuthenticationManager;
    const interceptor = new UnauthorizedInterceptor(router, auth, alert);
    onErrorResumeNext(interceptor.intercept(request, handler)).subscribe();
    handleSubject.error(error);
    tick();

    expect(handler.handle).toHaveBeenCalledWith(request);
    expect(auth.currentUser).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  }));
});
