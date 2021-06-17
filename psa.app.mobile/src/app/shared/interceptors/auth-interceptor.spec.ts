import { HttpHandler, HttpRequest } from '@angular/common/http';
import SpyObj = jasmine.SpyObj;

import { AuthInterceptor } from './auth-interceptor';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../auth/auth.model';

describe('AuthInterceptor', () => {
  let request: SpyObj<HttpRequest<any>>;
  let handler: SpyObj<HttpHandler>;
  let authMock: SpyObj<AuthService>;

  beforeEach(() => {
    request = jasmine.createSpyObj<SpyObj<HttpRequest<any>>>('HttpRequest', [
      'clone',
    ]);
    request.clone.and.returnValue(request);
    handler = jasmine.createSpyObj<SpyObj<HttpHandler>>('HttpHandler', [
      'handle',
    ]);
    authMock = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
  });

  it('should add an Authorization header if user is logged in', () => {
    authMock.getCurrentUser.and.returnValue({ token: 'ey!' } as User);
    const interceptor = new AuthInterceptor(authMock as AuthService);

    interceptor.intercept(request, handler);
    expect(request.clone).toHaveBeenCalledWith({
      setHeaders: {
        Authorization: 'ey!',
      },
    });
    expect(handler.handle).toHaveBeenCalledWith(request);
  });

  it('should pass through the request if user is not logged in', () => {
    authMock.getCurrentUser.and.returnValue(null);
    const interceptor = new AuthInterceptor(authMock as AuthService);

    interceptor.intercept(request, handler);
    expect(request.clone).not.toHaveBeenCalled();
    expect(handler.handle).toHaveBeenCalledWith(request);
  });
});
