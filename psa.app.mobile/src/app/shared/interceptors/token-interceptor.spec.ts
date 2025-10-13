/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  HttpHandlerFn,
  HttpRequest,
  HttpEvent,
  provideHttpClient,
  HttpHeaders,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { tokenInterceptor } from './token-interceptor';
import Keycloak from 'keycloak-js';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { KeycloakClientService } from 'src/app/auth/keycloak-client.service';
import { EndpointService } from '../services/endpoint/endpoint.service';

describe('tokenInterceptor', () => {
  let keycloak: jasmine.SpyObj<Keycloak>;
  let keycloakService: jasmine.SpyObj<KeycloakClientService>;
  let request: HttpRequest<unknown>;
  let handleSubject: Subject<HttpEvent<unknown>>;
  let next: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    keycloak = jasmine.createSpyObj<Keycloak>('Keycloak', [
      'updateToken',
      'authenticated',
    ]);
    keycloak.authenticated = true;
    keycloak.token = 'example-token';
    keycloak.updateToken.and.resolveTo(true);

    keycloakService = jasmine.createSpyObj<KeycloakClientService>(
      'KeycloakClientService',
      ['keycloak']
    );
    keycloakService.keycloak = keycloak;

    handleSubject = new Subject<HttpEvent<any>>();
    next = jasmine
      .createSpy('HttpHandlerFn')
      .and.callFake((_: HttpRequest<unknown>) => of({} as HttpEvent<unknown>));
    request = new HttpRequest('GET', 'url/something/');

    TestBed.configureTestingModule({
      providers: [
        { provide: KeycloakClientService, useValue: keycloakService },
        { provide: EndpointService, useValue: { getUrl: () => 'url' } },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  it('should not add the token if the user is not authenticated', (done) => {
    keycloak.authenticated = false;
    const request = new HttpRequest('GET', 'url/something/', {
      headers: new HttpHeaders(),
    });

    TestBed.runInInjectionContext(() => {
      tokenInterceptor(request, next).subscribe(() => {
        expect(next).toHaveBeenCalledWith(request);
        const resultingRequest = next.calls.mostRecent().args[0];
        expect(resultingRequest.headers.get('Authorization')).toBeNull();
        done();
      });
    });
  });

  it('should add the token if the user is authenticated', (done) => {
    const request = new HttpRequest('GET', 'url/something/', {
      headers: new HttpHeaders(),
    });

    TestBed.runInInjectionContext(() => {
      tokenInterceptor(request, next).subscribe(() => {
        expect(next).toHaveBeenCalled();
        const resultingRequest = next.calls.mostRecent().args[0];
        expect(resultingRequest.headers.get('Authorization')).toBe(
          'Bearer example-token'
        );
        done();
      });
    });
  });
});
