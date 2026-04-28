/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { Injectable } from '@angular/core';
import { AccessToken, User } from './auth.model';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root',
})
export class CurrentUser implements User {
  public username: string | undefined;
  public study: string | undefined;
  public locale: string | undefined;

  constructor(private readonly jwt: JwtService) {}

  /**
   * Populates instance with information from access token.
   */
  public init(token: string): void {
    const payload = this.jwt.decodeToken<AccessToken>(token);
    this.username = payload.username;
    this.study = payload.studies[0];
    this.locale = payload.locale;
  }

  public reset() {
    this.username = undefined;
    this.study = undefined;
    this.locale = undefined;
  }
}
