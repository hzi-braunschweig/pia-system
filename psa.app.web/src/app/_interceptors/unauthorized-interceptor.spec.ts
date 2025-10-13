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
  provideHttpClient,
} from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { onErrorResumeNext, Subject } from 'rxjs';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { unauthorizedInterceptor } from './unauthorized-interceptor';
import Keycloak from 'keycloak-js';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('unauthorizedInterceptor', () => {
  let request: HttpRequest<unknown>;
  let handleSubject: Subject<HttpEvent<unknown>>;
  let next: jasmine.Spy<HttpHandlerFn>;
  let document: jasmine.SpyObj<Document>;
  let keycloak: jasmine.SpyObj<Keycloak>;

  beforeEach(() => {
    request = new HttpRequest('GET', 'some/url/');
    handleSubject = new Subject<HttpEvent<unknown>>();
    next = jasmine.createSpy().and.returnValue(handleSubject.asObservable());

    document = jasmine.createSpyObj<Document>('Document', [], {
      location: { href: 'http://example.com/' } as Location,
    });

    keycloak = jasmine.createSpyObj('Keycloak', ['isTokenExpired', 'logout']);
    keycloak.isTokenExpired.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Keycloak, useValue: keycloak },
        { provide: DOCUMENT, useValue: document },
      ],
    });
  });

  it('should log user out if a 401 response was received', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 401 });
    onErrorResumeNext(
      TestBed.runInInjectionContext(() =>
        unauthorizedInterceptor(request, next)
      )
    ).subscribe();

    handleSubject.error(error);
    tick();

    expect(next).toHaveBeenCalledWith(request);
    expect(keycloak.logout).toHaveBeenCalledWith({
      redirectUri: 'http://example.com/',
    });
  }));

  it('should pass the error if a non 401 response was received and token is not expired', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 404 });
    keycloak.isTokenExpired.and.returnValue(false);

    let caughtError: unknown;
    TestBed.runInInjectionContext(() =>
      unauthorizedInterceptor(request, next)
    ).subscribe({
      error: (err) => (caughtError = err),
    });

    handleSubject.error(error);
    tick();

    expect(next).toHaveBeenCalledWith(request);
    expect(keycloak.logout).not.toHaveBeenCalled();
    expect(caughtError).toBe(error);
  }));

  it('should handle logout error', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 401 });
    onErrorResumeNext(
      TestBed.runInInjectionContext(() =>
        unauthorizedInterceptor(request, next)
      )
    ).subscribe();

    keycloak.logout.and.rejectWith('some error occurred');
    handleSubject.error(error);
    tick();

    expect(next).toHaveBeenCalledWith(request);
    expect(keycloak.logout).toHaveBeenCalledWith({
      redirectUri: 'http://example.com/',
    });
  }));
});
