import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../psa.app.core/models/user';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../psa.app.core/providers/auth-service/auth-service';

@Injectable()
export class AuthenticationManager {
  private currentUserSubject: BehaviorSubject<User>;
  public readonly currentUserObservable: Observable<User>;

  private jwtHelper: JwtHelperService = new JwtHelperService();

  constructor(private authenticationService: AuthService) {
    this.currentUserSubject = new BehaviorSubject<User>(this.currentUser);
    this.currentUserObservable = this.currentUserSubject.asObservable();
  }

  /**
   * Checks whether there is a current user logged in with a valid token, that is not expired
   */
  public isAuthenticated(): boolean {
    const currentUser = this.currentUser;
    if (currentUser && currentUser.token) {
      return !this.jwtHelper.isTokenExpired(currentUser.token);
    }
    return false;
  }

  set currentUser(user) {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(user);
  }

  get currentUser(): User | null {
    return JSON.parse(localStorage.getItem('currentUser'));
  }

  get currentUserTokenPayload(): any {
    const currentUser = this.currentUser;
    return currentUser && this.jwtHelper.decodeToken(currentUser.token);
  }

  get currentRole(): string | null {
    const payload = this.currentUserTokenPayload;
    return payload && payload.role;
  }

  get loginToken(): string {
    return localStorage.getItem('token_login');
  }

  set loginToken(value: string) {
    if (value) {
      localStorage.setItem('token_login', value);
    } else {
      localStorage.removeItem('token_login');
    }
  }

  get loginTokenPayload(): any {
    const loginToken = this.loginToken;
    return loginToken && this.jwtHelper.decodeToken(loginToken);
  }

  async logout(): Promise<void> {
    if (!this.currentUser) {
      return;
    }
    if (!this.jwtHelper.isTokenExpired(this.currentUser.token)) {
      await this.authenticationService
        .logout(this.currentUser.username)
        .catch((err) => console.error('Logout Error', err));
    }
    this.currentUser = null;
  }
}
