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
import { KeycloakService } from 'keycloak-angular';
import SpyObj = jasmine.SpyObj;

describe('UnauthorizedInterceptor', () => {
  let request: HttpRequest<unknown>;
  let handler: SpyObj<HttpHandler>;
  let handleSubject: Subject<HttpEvent<unknown>>;
  let document: SpyObj<Document>;
  let keycloak: SpyObj<KeycloakService>;

  beforeEach(() => {
    request = new HttpRequest('GET', 'some/url/');
    handler = jasmine.createSpyObj<SpyObj<HttpHandler>>('HttpHandler', [
      'handle',
    ]);
    handleSubject = new Subject<HttpEvent<unknown>>();
    handler.handle.and.returnValue(handleSubject.asObservable());
    document = jasmine.createSpyObj<Document>('Document', [], {
      location: { href: 'http://example.com/' } as Location,
    });
    keycloak = jasmine.createSpyObj('KeycloakService', [
      'isTokenExpired',
      'logout',
    ]);
    keycloak.isTokenExpired.and.returnValue(true);
  });

  it('should log user out if a 401 response was received', fakeAsync(async () => {
    const error = new HttpErrorResponse({ status: 401 });
    const interceptor = new UnauthorizedInterceptor(document, keycloak);
    onErrorResumeNext(interceptor.intercept(request, handler)).subscribe();
    handleSubject.error(error);
    tick();
    expect(handler.handle).toHaveBeenCalledWith(request);
    expect(keycloak.logout).toHaveBeenCalledWith('http://example.com/');
  }));

  it('should pass the error if a non 401 response was received and token is not expired', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 404 });
    const interceptor = new UnauthorizedInterceptor(document, keycloak);
    keycloak.isTokenExpired.and.returnValue(false);
    onErrorResumeNext(interceptor.intercept(request, handler)).subscribe();
    handleSubject.error(error);
    tick();

    expect(handler.handle).toHaveBeenCalledWith(request);
    expect(keycloak.logout).not.toHaveBeenCalled();
  }));

  it('should handle logout error', fakeAsync(async () => {
    const error = new HttpErrorResponse({ status: 401 });
    const interceptor = new UnauthorizedInterceptor(document, keycloak);
    onErrorResumeNext(interceptor.intercept(request, handler)).subscribe();
    keycloak.logout.and.rejectWith('some error occured');
    handleSubject.error(error);
    tick();
    expect(handler.handle).toHaveBeenCalledWith(request);
    expect(keycloak.logout).toHaveBeenCalledWith('http://example.com/');
  }));
});
