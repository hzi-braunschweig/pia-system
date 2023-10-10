/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { Injectable } from '@angular/core';
import { knownPrimaryRoles, Role, User } from '../psa.app.core/models/user';
import { KeycloakService } from 'keycloak-angular';
import { JwtService } from './jwt.service';
import { environment } from '../../environments/environment';

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
   */
  public async init(keycloak: KeycloakService): Promise<boolean> {
    try {
      const token = await keycloak.getToken();
      const payload = this.jwt.decodeToken(token);
      this.username = payload.username;
      this.studies = payload.studies;
      this.role = CurrentUser.getPrimaryRole(payload.realm_access.roles);
      this.locale = payload.locale ?? environment.defaultLanguage;

      return true;
    } catch (err) {
      console.error('Could not read current user from token', err);
      return false;
    }
  }

  private static getPrimaryRole(roles: string[]): Role {
    const primaryRole = roles.find(CurrentUser.isPrimaryRole);
    if (!primaryRole) {
      throw Error('No primary role found');
    }
    return primaryRole as Role;
  }

  private static isPrimaryRole(role: string): role is Role {
    return knownPrimaryRoles.includes(role as Role);
  }
}
