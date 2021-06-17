import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../psa.app.core/providers/auth-service/auth-service';
import { AuthenticationManager } from '../_services/authentication-manager.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { DialogPopUpComponent } from '../_helpers/dialog-pop-up';
import { User } from '../psa.app.core/models/user';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root',
})
export class TokenGuard implements CanActivate {
  constructor(
    private authIntern: AuthenticationManager,
    private authExtern: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> | boolean {
    return new Promise((resolve) => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      this.authIntern.currentUser = currentUser;

      resolve(true);
    });
  }

  /**
   * This could be replaced by using AuthGuard and RoleGuard
   * @deprecated
   * @param route the next route
   * @param state the current route state
   */
  checkToken(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const jwtHelper: JwtHelperService = new JwtHelperService();
    const expectedRole = route.data.expectedRole ? route.data.expectedRole : '';
    const expectedRoles = route.data.expectedRoles
      ? route.data.expectedRoles
      : [''];

    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
      const tokenPayload = jwtHelper.decodeToken(currentUser.token);
      if (
        this.authIntern.isAuthenticated() &&
        (tokenPayload.role === expectedRole ||
          expectedRoles.find((x) => x === tokenPayload.role))
      ) {
        if (currentUser && !currentUser.pw_change_needed) {
          return true;
        } else if (currentUser && currentUser.pw_change_needed) {
          this.router.navigate(['/changePassword']);
          return false;
        }
      } else {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url },
        });
        return false;
      }
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }
  }

  showFailureDialog(type): void {
    setTimeout(() => {
      let message = 'DIALOG.KEYLOGIN_ERROR_UNKNOWN';
      if (type === 'key') {
        message = 'DIALOG.KEYLOGIN_ERROR_KEY';
      } else if (type === 'mail') {
        message = 'DIALOG.KEYLOGIN_ERROR_MAIL';
      }
      this.dialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: message,
          isSuccess: false,
        },
      });
    });
  }
}
