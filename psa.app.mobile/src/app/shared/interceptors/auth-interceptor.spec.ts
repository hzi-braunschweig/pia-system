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
    authMock = jasmine.createSpyObj(AuthService, ['getToken']);
  });

  it('should add an Authorization header if user is logged in', () => {
    authMock.getToken.and.returnValue('ey!');
    const interceptor = new AuthInterceptor(authMock);

    interceptor.intercept(request, handler);
    expect(request.clone).toHaveBeenCalledWith({
      setHeaders: {
        Authorization: 'ey!',
      },
    });
    expect(handler.handle).toHaveBeenCalledWith(request);
  });

  it('should pass through the request if user is not logged in', () => {
    authMock.getToken.and.returnValue(null);
    const interceptor = new AuthInterceptor(authMock);

    interceptor.intercept(request, handler);
    expect(request.clone).not.toHaveBeenCalled();
    expect(handler.handle).toHaveBeenCalledWith(request);
  });
});
