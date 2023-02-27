/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fetch from '../utils/fetch.util';
import chalk from 'chalk';
import { Response } from 'node-fetch';
import { faker } from '@faker-js/faker/locale/de';

import {
  AuthToken,
  Proband,
  ProfessionalUser,
  Realm,
  UserCredentials,
} from '../models/user.model';
import { KeycloakTokenResponse } from '../models/keycloak-token-response';
import { UserExportService } from '../services/user-export.service';

export class UserClient {
  private tokens = new Map<UserCredentials, KeycloakTokenResponse>();

  constructor(
    private readonly ci: boolean,
    private readonly baseUrl: string,
    private readonly adminBaseUrl: string,
    private readonly keycloakAdmin: UserCredentials,
    private readonly sysAdmin: UserCredentials,
    private readonly userExportService: UserExportService
  ) {}

  public async getAdminToken(): Promise<AuthToken> {
    return this.getRefreshableToken(this.sysAdmin)();
  }

  private async getKeycloakToken(): Promise<AuthToken> {
    return this.getRefreshableToken(this.keycloakAdmin)();
  }

  public getRefreshableToken(
    credentials: UserCredentials
  ): () => Promise<AuthToken> {
    return async () => {
      let token: KeycloakTokenResponse | undefined;

      token = this.tokens.get(credentials);

      if (!token) {
        token = await this.login(credentials);
        this.tokens.set(credentials, token);
      } else if (this.isTokenExpired(token.access_token)) {
        const respone = await this.refresh(credentials.realm, token);
        this.tokens.set(credentials, respone);
      }

      if (!this.tokens.has(credentials)) {
        throw new Error('Login did not succeed');
      }

      return this.returnToken(
        this.tokens.get(credentials) as KeycloakTokenResponse
      );
    };
  }

  /**
   * Takes user credentials and performs a login in order to return a token for API requests
   *
   * @param user user to login
   */
  public async login(user: UserCredentials): Promise<KeycloakTokenResponse> {
    const realmSlug = this.returnRealmSlug(user.realm);
    const response = await fetch(
      this.baseUrl + `/auth/realms/${realmSlug}/protocol/openid-connect/token`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        body: new URLSearchParams({
          client_id: this.returnClient(user.realm),
          grant_type: 'password',
          scope: 'openid',
          username: user.username,
          password: user.password,
        }).toString(),
      }
    );

    return (await response?.json()) as KeycloakTokenResponse;
  }

  public async refresh(
    realm: Realm,
    tokenResponse: KeycloakTokenResponse
  ): Promise<KeycloakTokenResponse> {
    const realmSlug = this.returnRealmSlug(realm);

    const response = await fetch(
      this.baseUrl + `/auth/realms/${realmSlug}/protocol/openid-connect/token`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        body: new URLSearchParams({
          client_id: this.returnClient(realm),
          grant_type: 'refresh_token',
          refresh_token: tokenResponse.refresh_token,
        }).toString(),
      }
    );

    return (await response?.json()) as KeycloakTokenResponse;
  }

  public returnToken(tokenResponse: KeycloakTokenResponse): AuthToken {
    return `${tokenResponse.token_type} ${tokenResponse.access_token}`;
  }

  /**
   * Creates professional role and returns its credentials
   * @param user the user to create
   */
  public async createProfessionalUser(
    user: ProfessionalUser
  ): Promise<UserCredentials> {
    const password = faker.internet.password(10, false, undefined, '1Ab$_');

    await fetch(this.adminBaseUrl + '/user/users', {
      method: 'post',
      body: JSON.stringify(user),
      headers: {
        Authorization: await this.getAdminToken(),
        'Content-Type': 'application/json',
      },
    });

    await this.resetUserPassword('admin', user.username, password);

    if (this.ci) {
      console.log(
        chalk.blue(
          'UserClient: created professional user with username: ' +
            user.username
        )
      );
    }

    const credentials: UserCredentials = {
      username: user.username,
      password,
      realm: 'admin',
    };

    this.userExportService.addProfessional(
      credentials,
      user.role,
      user.study_accesses
    );

    return Promise.resolve(credentials);
  }

  public async createProband(
    proband: Proband,
    studyId: string,
    utToken: () => Promise<AuthToken>
  ): Promise<UserCredentials> {
    // 2. register pseudonym
    await fetch(this.adminBaseUrl + '/user/plannedprobands', {
      method: 'post',
      body: JSON.stringify({ pseudonyms: [proband.pseudonym] }),
      headers: {
        Authorization: await utToken(),
        'Content-Type': 'application/json',
      },
    });
    // 3. register proband with pseudonym
    await fetch(this.adminBaseUrl + '/user/studies/' + studyId + '/probands', {
      method: 'post',
      body: JSON.stringify(proband),
      headers: {
        Authorization: await utToken(),
        'Content-Type': 'application/json',
      },
    });
    // 4. get password of new proband
    const response = await fetch(
      this.adminBaseUrl + '/user/plannedprobands/' + proband.pseudonym,
      {
        method: 'get',
        headers: { Authorization: await utToken() },
      }
    );
    const { user_id: username } = (await response?.json()) as {
      user_id: string;
      password: string;
    };

    const password = faker.internet.password(10, false, undefined, '1Ab$_');

    const probandCredentials: UserCredentials = {
      username,
      password,
      realm: 'proband',
    };
    // 5. remove required action to set a new password
    await this.removeRequiredActions('proband', username);
    await this.resetUserPassword('proband', username, password);

    if (this.ci) {
      console.log(
        chalk.blue(
          'UserClient: created proband username: ' + probandCredentials.username
        )
      );
    }

    this.userExportService.addProband(probandCredentials, studyId);

    return probandCredentials;
  }

  private async resetUserPassword(
    realm: Realm,
    user: string,
    newPassword: string
  ): Promise<Response | undefined> {
    const userId = await this.getKeycloakUserId(realm, user);
    const realmSlug = this.returnRealmSlug(realm);

    return fetch(
      `${this.baseUrl}/auth/admin/realms/${realmSlug}/users/${userId}/reset-password`,
      {
        method: 'PUT',
        headers: {
          Authorization: await this.getKeycloakToken(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password',
          temporary: false,
          value: newPassword,
        }),
      }
    );
  }

  private async removeRequiredActions(
    realm: Realm,
    user: string
  ): Promise<void> {
    const userId = await this.getKeycloakUserId(realm, user);
    const realmSlug = this.returnRealmSlug(realm);

    await fetch(
      `${this.baseUrl}/auth/admin/realms/${realmSlug}/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: await this.getKeycloakToken(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requiredActions: [],
        }),
      }
    );
  }

  private async getKeycloakUserId(realm: Realm, user: string): Promise<string> {
    const realmSlug = this.returnRealmSlug(realm);
    const response = await fetch(
      `${this.baseUrl}/auth/admin/realms/${realmSlug}/users?username=${user}`,
      {
        method: 'GET',
        headers: {
          Authorization: await this.getKeycloakToken(),
          'Content-Type': 'application/json',
        },
      }
    );

    const result = (await response?.json()) as [{ id: string }];

    if (!result.length) {
      throw new Error(`Could not find user ${realmSlug}/${user}`);
    }

    return result[0].id;
  }

  private returnRealmSlug(realm: Realm): string {
    if (realm === 'master') {
      return realm;
    }

    return `pia-${realm}-realm`;
  }

  private returnClient(realm: Realm): string {
    if (realm === 'master') {
      return `admin-cli`;
    }

    return `pia-${realm}-web-app-client`;
  }

  private isTokenExpired(token: string): boolean {
    const parsedToken = this.returnPayloadFrom(token);
    const exp = parsedToken.exp * 1000 - 10 * 1000; // refresh 10 seconds earlier to ensure a working access token
    return Date.now() >= exp;
  }

  private returnPayloadFrom(token: string): { exp: number; groups: string[] } {
    const tokenPayload = token.split('.')[1];
    const rawToken = Buffer.from(tokenPayload, 'base64').toString();
    return JSON.parse(rawToken);
  }
}
