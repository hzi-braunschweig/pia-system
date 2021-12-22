/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
  AccessToken,
  LoginResponse,
  LoginToken,
  Role,
  User,
} from '../psa.app.core/models/user';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class AuthenticationManager {
  private readonly currentUserSubject: BehaviorSubject<User>;
  public readonly currentUser$: Observable<User>;

  constructor() {
    this.currentUserSubject = new BehaviorSubject<User>(this.getCurrentUser());
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  private jwtHelper: JwtHelperService = new JwtHelperService();

  private getUserFromToken(token: string | null): User | null {
    if (!token) {
      return null;
    }
    const payload: AccessToken = this.jwtHelper.decodeToken(token);
    return payload
      ? {
          username: payload.username,
          role: payload.role,
          studies: payload.groups,
        }
      : null;
  }

  public handleLoginResponse(loginData: LoginResponse): void {
    localStorage.setItem('token', loginData.token);
    if (typeof loginData.pw_change_needed === 'boolean') {
      localStorage.setItem(
        'pwChangeNeeded',
        JSON.stringify(loginData.pw_change_needed)
      );
    }
    if (typeof loginData.token_login === 'string') {
      localStorage.setItem('token_login', loginData.token_login);
    }
    this.currentUserSubject.next(this.getUserFromToken(loginData.token));
  }

  public logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('pwChangeNeeded');
    this.currentUserSubject.next(null);
  }

  public removeLoginToken(): void {
    localStorage.removeItem('token_login');
  }

  public setPasswordChangeNeeded(value: boolean | null): void {
    localStorage.setItem('pwChangeNeeded', JSON.stringify(value));
  }

  public isPasswordChangeNeeded(): boolean | null {
    return JSON.parse(localStorage.getItem('pwChangeNeeded'));
  }

  public getLoginToken(): string | null {
    return localStorage.getItem('token_login');
  }

  public getLoginTokenUsername(): string | null {
    const token = this.getLoginToken();
    if (!token) {
      return null;
    }
    const loginTokenPayload: LoginToken = this.jwtHelper.decodeToken(token);
    return loginTokenPayload.username ?? null;
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getCurrentUser(): User | null {
    return this.getUserFromToken(this.getToken());
  }

  public getCurrentUsername(): string | null {
    return this.getCurrentUser()?.username ?? null;
  }

  public getCurrentRole(): Role | null {
    return this.getCurrentUser()?.role ?? null;
  }

  /**
   * gets the study of the currently logged in proband
   */
  public getCurrentStudy(): string | null {
    const user = this.getCurrentUser();
    if (!user) {
      return null;
    }
    if (user.role !== 'Proband') {
      throw Error('this function can only be used if a proband is logged in');
    }
    return user.studies[0];
  }

  /**
   * Checks whether there is a current user logged in with a valid token, that is not expired
   */
  public isAuthenticated(): boolean {
    const token = this.getToken();
    return Boolean(token && !this.jwtHelper.isTokenExpired(token));
  }
}
