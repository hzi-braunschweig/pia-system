/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpHandler, HttpRequest } from '@angular/common/http';

import { AuthInterceptor } from './auth-interceptor';
import { AuthService } from '../../auth/auth.service';
import SpyObj = jasmine.SpyObj;

describe('AuthInterceptor', () => {
  let request: SpyObj<HttpRequest<unknown>>;
  let handler: SpyObj<HttpHandler>;
  let authMock: SpyObj<AuthService>;

  beforeEach(() => {
    request = jasmine.createSpyObj(HttpRequest, ['clone']);
    request.clone.and.returnValue(request);
    handler = jasmine.createSpyObj(HttpHandler, ['handle']);
    authMock = jasmine.createSpyObj(AuthService, [
      'isAuthenticated',
      'getToken',
      'isLegacyLogin',
    ]);
  });

  it('should add an authorization header if user is logged in via legacy authentication', () => {
    authMock.isLegacyLogin.and.returnValue(true);
    authMock.isAuthenticated.and.returnValue(true);
    authMock.getToken.and.returnValue('Bearer fake-token-string');

    const interceptor = new AuthInterceptor(authMock);

    interceptor.intercept(request, handler);
    expect(request.clone).toHaveBeenCalledWith({
      setHeaders: {
        Authorization: 'Bearer fake-token-string',
      },
    });
    expect(handler.handle).toHaveBeenCalledWith(request);
  });

  it('should pass through the request if user uses new login', () => {
    authMock.isAuthenticated.and.returnValue(true);
    authMock.getToken.and.returnValue('Some token value');

    const interceptor = new AuthInterceptor(authMock);

    interceptor.intercept(request, handler);
    expect(request.clone).not.toHaveBeenCalled();
    expect(handler.handle).toHaveBeenCalledWith(request);
  });

  it('should pass through the request if user is not logged in', () => {
    authMock.isAuthenticated.and.returnValue(false);
    authMock.getToken.and.returnValue(null);

    const interceptor = new AuthInterceptor(authMock);

    interceptor.intercept(request, handler);
    expect(request.clone).not.toHaveBeenCalled();
    expect(handler.handle).toHaveBeenCalledWith(request);
  });
});
