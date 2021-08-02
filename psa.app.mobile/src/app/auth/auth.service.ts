/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, Subject } from 'rxjs';

import { User } from './auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly loggedIn: Observable<void>;

  private loggedInSubject = new Subject<void>();

  private jwtHelper: JwtHelperService = new JwtHelperService();

  constructor() {
    this.loggedIn = this.loggedInSubject.asObservable();
  }

  isAuthenticated(): boolean {
    const currentUser = this.getCurrentUser();
    return Boolean(
      currentUser &&
        currentUser.token &&
        !this.jwtHelper.isTokenExpired(currentUser.token)
    );
  }

  isPasswordChangeNeeded(): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser && currentUser.pw_change_needed;
  }

  getCurrentUser(): User {
    return JSON.parse(localStorage.getItem('currentUser'));
  }

  setPasswordNeeded(isNeeded: boolean) {
    const currentUser: User = this.getCurrentUser();
    currentUser.pw_change_needed = isNeeded;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }

  resetCurrentUser(): void {
    localStorage.removeItem('currentUser');
  }

  emitLogin() {
    this.loggedInSubject.next();
  }
}
