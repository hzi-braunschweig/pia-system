/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AuthInterceptor } from './auth-interceptor';
import { AuthenticationManager } from '../_services/authentication-manager.service';
import { HttpHandler, HttpRequest } from '@angular/common/http';
import SpyObj = jasmine.SpyObj;

describe('AuthInterceptor', () => {
  let request: SpyObj<HttpRequest<any>>;
  let handler: SpyObj<HttpHandler>;

  beforeEach(() => {
    request = jasmine.createSpyObj<SpyObj<HttpRequest<any>>>('HttpRequest', [
      'clone',
    ]);
    request.clone.and.returnValue(request);
    handler = jasmine.createSpyObj<SpyObj<HttpHandler>>('HttpHandler', [
      'handle',
    ]);
  });

  it('should add an Authorization header if user is logged in', () => {
    const authMock = { currentUser: { token: 'ey!' } };
    const interceptor = new AuthInterceptor(authMock as AuthenticationManager);

    interceptor.intercept(request, handler);
    expect(request.clone).toHaveBeenCalledWith({
      setHeaders: {
        Authorization: 'ey!',
      },
    });
    expect(handler.handle).toHaveBeenCalledWith(request);
  });

  it('should pass through the request if user is not logged in', () => {
    const authMock = { currentUser: null };
    const interceptor = new AuthInterceptor(authMock as AuthenticationManager);

    interceptor.intercept(request, handler);
    expect(request.clone).not.toHaveBeenCalled();
    expect(handler.handle).toHaveBeenCalledWith(request);
  });
});
