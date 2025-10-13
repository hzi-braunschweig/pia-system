/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { effect, inject, Injectable } from '@angular/core';
import { knownPrimaryRoles, Role, User } from '../psa.app.core/models/user';
import Keycloak from 'keycloak-js';
import { JwtService } from './jwt.service';
import { environment } from '../../environments/environment';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType } from 'keycloak-angular';

@Injectable()
export class CurrentUser implements User {
  public username: string;
  public role: Role;
  public studies: string[];
  public locale: string;
  private readonly keycloak = inject(Keycloak);
  private readonly keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);

  public get study(): string {
    if (this.isProfessional()) {
      throw new Error('Cannot get single study for professionals');
    }
    return this.studies[0];
  }

  constructor(private readonly jwt: JwtService) {
    effect(() => {
      const keycloakEvent = this.keycloakSignal();
      if (keycloakEvent.type === KeycloakEventType.Ready) {
        this.populateUserFromToken(this.keycloak.token);
      }

      if (keycloakEvent.type === KeycloakEventType.AuthLogout) {
        this.resetUser();
      }
    });
  }

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
  private populateUserFromToken(token: string) {
    try {
      if (token) {
        const token = this.keycloak.token;
        const payload = this.jwt.decodeToken(token);
        this.username = payload.username;
        this.studies = payload.studies;
        this.role = CurrentUser.getPrimaryRole(payload.realm_access.roles);
        this.locale = payload.locale ?? environment.defaultLanguage;
      } else {
        this.resetUser();
      }
    } catch (err) {
      console.error('Could not read current user from token', err);
      this.resetUser();
    }
  }

  private resetUser() {
    this.username = undefined;
    this.studies = undefined;
    this.role = undefined;
    this.locale = undefined;
  }

  private static getPrimaryRole(roles: string[]): Role {
    const primaryRole = roles.find(CurrentUser.isPrimaryRole);
    if (!primaryRole) {
      throw Error('No primary role found');
    }
    return primaryRole;
  }

  private static isPrimaryRole(role: string): role is Role {
    return knownPrimaryRoles.includes(role as Role);
  }
}
