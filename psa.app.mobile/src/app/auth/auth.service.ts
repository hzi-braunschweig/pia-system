/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Inject, Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BehaviorSubject, Observable } from 'rxjs';

import { AccessToken, LoginResponse, Role, User } from './auth.model';
import { DOCUMENT } from '@angular/common';
import { KeycloakTokenParsed } from 'keycloak-js';
import { HandlePasswordChangeNotAllowedError } from './errors/handle-password-change-not-allowed-error';
import { InvalidTokenError } from './errors/invalid-token-error';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly currentUserSubject: BehaviorSubject<User>;
  public readonly currentUser$: Observable<User>;
  private _isLegacyLogin: boolean;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.currentUserSubject = new BehaviorSubject<User>(this.getCurrentUser());
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  private jwtHelper: JwtHelperService = new JwtHelperService();

  private readonly beforeLogout = new Set<() => Promise<void>>();

  private getUserFromToken(token: string | null): User | null {
    if (!token) {
      return null;
    }
    const payload: AccessToken = this.jwtHelper.decodeToken(token);

    return payload
      ? {
          username: payload.username,
          role: this.getRoleFromAccessToken(payload),
          study: this.getStudyFromAccessToken(payload),
        }
      : null;
  }

  private getRoleFromAccessToken(
    accessToken: AccessToken | KeycloakTokenParsed
  ): Role {
    if ('role' in accessToken) {
      return accessToken.role;
    } else if ('realm_access' in accessToken) {
      return accessToken.realm_access.roles[0] as Role;
    }

    throw new InvalidTokenError();
  }

  private getStudyFromAccessToken(
    accessToken: AccessToken | KeycloakTokenParsed
  ): string {
    if ('groups' in accessToken) {
      return accessToken.groups[0];
    } else if ('studies' in accessToken) {
      return accessToken.studies[0];
    }

    throw new InvalidTokenError();
  }

  /**
   * Register an async task which needs to be executed before logout
   */
  public onBeforeLogout(beforeLogout: () => Promise<void>) {
    this.beforeLogout.add(beforeLogout);
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public isLegacyLogin() {
    return this._isLegacyLogin;
  }

  public isAuthenticated(): boolean {
    const token = this.getToken();
    return Boolean(token && !this.jwtHelper.isTokenExpired(token));
  }

  public isPasswordChangeNeeded(): boolean {
    return JSON.parse(localStorage.getItem('pwChangeNeeded'));
  }

  public setPasswordChangeNeeded(isNeeded: boolean) {
    if (!this._isLegacyLogin) {
      throw new HandlePasswordChangeNotAllowedError();
    }
    localStorage.setItem('pwChangeNeeded', JSON.stringify(isNeeded));
  }

  public getCurrentUser(): User | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return this.getUserFromToken(token);
  }

  public getRememberedUsername(): string | null {
    let username = localStorage.getItem('remembered_username');
    if (username) {
      return username;
    }
    // migrate old implementation with login_token
    const loginToken = localStorage.getItem('token_login');
    if (loginToken) {
      username = this.jwtHelper.decodeToken(loginToken).username;
      localStorage.setItem('remembered_username', username);
      localStorage.removeItem('token_login');
    }
    return username;
  }

  public setRememberedUsername(username: string | null) {
    if (username) {
      localStorage.setItem('remembered_username', username);
    } else {
      localStorage.removeItem('remembered_username');
    }
  }

  public removeRememberedUsername(): void {
    localStorage.removeItem('remembered_username');
  }

  public resetCurrentUser(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('pwChangeNeeded');
  }

  async logout(): Promise<void> {
    for (const beforeLogout of this.beforeLogout) {
      await beforeLogout();
    }
    this.beforeLogout.clear();
    this.resetCurrentUser();
    this.reloadApp();
    this.currentUserSubject.next(null);
  }

  public handleKeycloakToken(token: string): void {
    this._isLegacyLogin = false;
    localStorage.setItem('token', token);
    this.currentUserSubject.next(this.getUserFromToken(token));
  }

  public handleLegacyLoginResponse(loginData: LoginResponse): void {
    this._isLegacyLogin = true;
    localStorage.setItem('token', loginData.token);
    if (typeof loginData.pw_change_needed === 'boolean') {
      localStorage.setItem(
        'pwChangeNeeded',
        JSON.stringify(loginData.pw_change_needed)
      );
    }
    this.currentUserSubject.next(this.getUserFromToken(loginData.token));
  }

  /**
   * Executes a full page reload in order to clear any cached views.
   *
   * Please keep in mind that any running async task is going to stop
   * immediately.
   */
  private reloadApp() {
    this.document.defaultView.location.href = '/';
  }
}
