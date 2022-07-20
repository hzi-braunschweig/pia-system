/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class AlertService {
  private subject = new Subject<AlertMessage>();
  private subjectObservable = this.subject.asObservable();
  private keepAfterNavigationChange = false;

  constructor(private router: Router, private translate: TranslateService) {
    // clear alert message on route change
    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (this.keepAfterNavigationChange) {
          // only keep for a single location change
          this.keepAfterNavigationChange = false;
        } else {
          // clear alert
          this.subject.next(null);
        }
      }
    });
  }

  success(message: string, keepAfterNavigationChange = false): void {
    this.keepAfterNavigationChange = keepAfterNavigationChange;
    this.subject.next({ type: 'success', text: message });
  }

  /**
   * Notifies all Observers (e.g. the alert Component) for a new error message
   * @param message A message string that will be translated if a translation exists
   * @param options Some options to alter the behavior. keepAfterNavigation keeps
   * the message even thou you navigate
   */
  errorMessage(
    message: string,
    options?: { keepAfterNavigation?: boolean }
  ): void {
    this.keepAfterNavigationChange = options
      ? !!options.keepAfterNavigation
      : false;
    this.subject.next({ type: 'error', text: message });
  }

  /**
   * Notifies all Observers (e.g. the alert Component) for a new error message and logs the error to the console
   * @param error Any Error. If no message is defined and the error is known, a default message for this error will be shown
   * @param message A optional (default: undefined) message string that will be translated if a translation exists
   * @param options Some options to alter the behavior. keepAfterNavigation keeps
   * the message even thou you navigate
   */
  errorObject(
    error: Error,
    message?: string,
    options?: { keepAfterNavigation: boolean }
  ): void {
    // if message is defined show message
    if (!message) {
      if (error instanceof HttpErrorResponse) {
        message = 'ERROR.ERROR_HTTP_' + error.status;
        if (this.translate.instant(message) === message) {
          message = 'ERROR.ERROR_UNKNOWN';
        }
        if (error.status === 401 && error.error.message === 'Expired token') {
          message = 'ERROR.ERROR_TOKEN_EXPIRED';
        }
      } else {
        message = 'ERROR.ERROR_UNKNOWN';
      }
    }
    console.error('AlertService:', this.translate.instant(message), error);
    this.errorMessage(message, options);
  }

  getMessage(): Observable<AlertMessage> {
    return this.subjectObservable;
  }
}

export interface AlertMessage {
  type: 'success' | 'error';
  text: string;
}
