import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { MenuController } from '@ionic/angular';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

/**
 * Logs user out and navigates back to login if backend returns unauthorized error
 */
@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {
  constructor(
    private auth: AuthService,
    private menuCtrl: MenuController,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const currentUser = this.auth.getCurrentUser();
        if (error.status === 401 && currentUser !== null) {
          this.auth.resetCurrentUser();
          this.menuCtrl.enable(false);
          this.router.navigate(['auth', 'login']);
        }
        return throwError(error);
      })
    );
  }
}
