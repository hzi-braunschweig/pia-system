/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Inject, Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, Subject } from 'rxjs';

import { User } from './auth.model';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public readonly loggedIn: Observable<void>;
  private loggedInSubject = new Subject<void>();

  private jwtHelper: JwtHelperService = new JwtHelperService();

  private readonly beforeLogout: (() => Promise<void>)[] = [];

  /**
   * Register an async task which needs to be executed before logout
   */
  public onBeforeLogout(beforeLogout: () => Promise<void>) {
    this.beforeLogout.push(beforeLogout);
  }

  constructor(@Inject(DOCUMENT) private document: Document) {
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

  async logout(): Promise<void> {
    for (const beforeLogout of this.beforeLogout) {
      await beforeLogout();
    }
    this.beforeLogout.length = 0;
    this.resetCurrentUser();
    this.reloadApp();
  }

  emitLogin() {
    this.loggedInSubject.next();
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
