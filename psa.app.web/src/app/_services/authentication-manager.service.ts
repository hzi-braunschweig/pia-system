/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../psa.app.core/models/user';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class AuthenticationManager {
  private currentUserSubject: BehaviorSubject<User> = new BehaviorSubject<User>(
    this.currentUser
  );

  public readonly currentUserObservable: Observable<User> =
    this.currentUserSubject.asObservable();

  private jwtHelper: JwtHelperService = new JwtHelperService();

  public get currentRole(): string | null {
    const payload = this.currentUserTokenPayload;
    return payload && payload.role;
  }

  public get loginToken(): string {
    return localStorage.getItem('token_login');
  }

  public set loginToken(value: string) {
    if (value) {
      localStorage.setItem('token_login', value);
    } else {
      localStorage.removeItem('token_login');
    }
  }

  public get loginTokenPayload(): any {
    const loginToken = this.loginToken;
    return loginToken && this.jwtHelper.decodeToken(loginToken);
  }

  public set currentUser(user: User | null) {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(user);
  }

  public get currentUser(): User | null {
    return JSON.parse(localStorage.getItem('currentUser'));
  }

  private get currentUserTokenPayload(): any {
    const currentUser = this.currentUser;
    return currentUser && this.jwtHelper.decodeToken(currentUser.token);
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

  public async logout(): Promise<void> {
    this.currentUser = null;
  }
}
