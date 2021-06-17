import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../../auth/auth.service';

/**
 * Injects Authorization Header to every request
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const currentUser = this.auth.getCurrentUser();
    if (currentUser !== null) {
      request = request.clone({
        setHeaders: {
          Authorization: currentUser.token,
        },
      });
    }
    return next.handle(request);
  }
}
