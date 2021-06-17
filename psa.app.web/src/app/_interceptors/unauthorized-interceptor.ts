import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthenticationManager } from '../_services/authentication-manager.service';
import { AlertService } from '../_services/alert.service';

/**
 * Logs user out and navigates back to login if backend returns unauthorized error
 */
@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private auth: AuthenticationManager,
    private alertService: AlertService
  ) {}

  private loggingOut = false;

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (
          error.status === 401 &&
          this.auth.currentUser !== null &&
          !this.loggingOut
        ) {
          this.loggingOut = true;
          const url = this.router.url;
          this.auth
            .logout()
            .catch((err) =>
              this.alertService.errorObject(err, undefined, {
                keepAfterNavigation: true,
              })
            )
            .finally(() => {
              this.loggingOut = false;
              if (!url.includes('returnUrl')) {
                this.router.navigate(['login'], {
                  queryParams: { returnUrl: url },
                });
              }
            });
        }
        return throwError(error);
      })
    );
  }
}
