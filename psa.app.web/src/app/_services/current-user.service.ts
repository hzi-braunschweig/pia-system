/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { Injectable } from '@angular/core';
import { Role, User } from '../psa.app.core/models/user';
import { KeycloakService } from 'keycloak-angular';
import { JwtService } from './jwt.service';

@Injectable()
export class CurrentUser implements User {
  public username: string;
  public role: Role;
  public studies: string[];
  public locale: string;

  public get study(): string {
    if (this.isProfessional()) {
      throw new Error('Cannot get single study for professionals');
    }
    return this.studies[0];
  }

  constructor(private readonly jwt: JwtService) {}

  public isProband(): boolean {
    return this.role === 'Proband';
  }

  public isProfessional(): boolean {
    return !this.isProband();
  }

  public hasRole(role: Role): boolean {
    return this.role === role;
  }

  /**
   * Populates instance with information from access token.
   *
   * Attention:
   * The role is currently read from the first realm access
   * roles array entry. This assumes that every user exactly
   * has one role - which was at least true when this was
   * implemented.
   */
  public async init(keycloak: KeycloakService): Promise<boolean> {
    try {
      const token = await keycloak.getToken();
      const payload = this.jwt.decodeToken(token);
      this.username = payload.username;
      this.studies = payload.studies;
      this.role = payload.realm_access.roles[0];
      this.locale = payload.locale;

      return true;
    } catch (err) {
      console.error('Could not read current user from token', err);
      return false;
    }
  }
}
