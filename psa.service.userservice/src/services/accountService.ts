/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MarkRequired } from 'ts-essentials';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { asyncMap } from '@pia/lib-service-core';
import { AuthServerClient } from '@pia-system/lib-auth-server-client';
import {
  AccountCreateError,
  AccountNotFound,
  StudyNotFoundError,
  UnknownRole,
} from '../errors';
import { Role } from '../models/role';

interface AccountInput {
  username: string;
  email?: string;
  role: Role;
  studies: string[];
  password: string;
}

interface AccountRole {
  id: string;
  name: string;
}

export type SafeUserRepresentation = MarkRequired<
  UserRepresentation,
  'id' | 'username'
>;

export type SafeGroupRepresentation = MarkRequired<
  GroupRepresentation,
  'id' | 'path'
>;

export abstract class AccountService {
  protected static readonly USER_FETCH_LIMIT = 1000;

  protected static async getAccountsByStudyName(
    studyName: string,
    authClient: AuthServerClient
  ): Promise<SafeUserRepresentation[]> {
    const { id } = await this.getGroupByNameOrFail(studyName, authClient);

    const users = await authClient.groups.listMembers({
      id,
      max: this.USER_FETCH_LIMIT,
      realm: authClient.realm,
    });
    this.warnIfUserFetchLimitReached(users);
    return users.filter(this.isSafeUserRepresentation);
  }

  protected static async getAccountsByRole(
    role: Role,
    authClient: AuthServerClient
  ): Promise<SafeUserRepresentation[]> {
    const users = await authClient.roles.findUsersWithRole({
      name: role,
      max: this.USER_FETCH_LIMIT,
      realm: authClient.realm,
    });
    this.warnIfUserFetchLimitReached(users);
    return users.filter(this.isSafeUserRepresentation);
  }

  protected static async createAccount(
    account: AccountInput,
    authClient: AuthServerClient,
    temporaryPassword: boolean
  ): Promise<void> {
    const groups = await asyncMap(
      account.studies,
      async (groupName) =>
        (
          await this.getGroupByNameOrFail(groupName, authClient)
        ).path
    );

    const role = await this.getRole(account.role, authClient);

    try {
      const { id } = await authClient.users.create({
        realm: authClient.realm,
        username: account.username,
        ...(account.email ? { email: account.email } : {}),
        groups,
        enabled: true,
        credentials: [
          {
            type: 'password',
            value: account.password,
            temporary: temporaryPassword,
          },
        ],
      });
      await authClient.users.addRealmRoleMappings({
        id,
        realm: authClient.realm,
        roles: [role],
      });
    } catch (error) {
      throw new AccountCreateError(
        'An error occurred while trying to create the account',
        error
      );
    }
  }

  protected static async getRole(
    roleName: string,
    authClient: AuthServerClient
  ): Promise<AccountRole> {
    const role = await authClient.roles.findOneByName({
      name: roleName,
      realm: authClient.realm,
    });
    if (!role?.id) {
      throw new UnknownRole();
    }
    return role as AccountRole;
  }

  protected static async getGroupNamesByUserId(
    userId: string,
    authClient: AuthServerClient
  ): Promise<string[]> {
    return (
      await authClient.users.listGroups({
        id: userId,
        briefRepresentation: true,
        realm: authClient.realm,
      })
    )
      .filter(
        (group): group is MarkRequired<GroupRepresentation, 'name'> =>
          !!group.name
      )
      .map((group) => group.name);
  }

  protected static async getGroupByNameOrFail(
    groupName: string,
    authClient: AuthServerClient,
    includeAttributes = false
  ): Promise<SafeGroupRepresentation> {
    const availableGroups = await authClient.groups.find({
      realm: authClient.realm,
      briefRepresentation: !includeAttributes,
    });
    const groupRepresentation = availableGroups.find(
      (group) => group.name === groupName
    );
    if (
      !groupRepresentation ||
      !this.isSafeGroupRepresentation(groupRepresentation)
    ) {
      throw new StudyNotFoundError();
    }
    return groupRepresentation;
  }

  protected static async getUserOrFail(
    username: string,
    authClient: AuthServerClient
  ): Promise<SafeUserRepresentation> {
    const users = await authClient.users.find({
      username,
      realm: authClient.realm,
    });
    const found = users.find((u) => u.username === username);
    if (!found || !this.isSafeUserRepresentation(found)) {
      throw new AccountNotFound();
    }
    return found;
  }

  protected static async createGroup(
    groupName: string,
    authClient: AuthServerClient
  ): Promise<void> {
    await authClient.groups.create({
      name: groupName,
      realm: authClient.realm,
    });
  }

  protected static async deleteGroupByName(
    groupName: string,
    authClient: AuthServerClient
  ): Promise<void> {
    const { id } = await this.getGroupByNameOrFail(groupName, authClient);
    await authClient.groups.del({
      id,
      realm: authClient.realm,
    });
  }

  /**
   * Type guard to test if a user representation is safe to use.
   *
   * Users created for public API clients are not safe user representations.
   * This method checks if the username indicates the user being a client service account.
   *
   * @param user - the user representation to test
   */
  protected static isSafeUserRepresentation(
    this: void,
    user: UserRepresentation
  ): user is SafeUserRepresentation {
    return (
      !!user.id &&
      !!user.username &&
      !user.username.startsWith('service-account-')
    );
  }

  protected static isSafeGroupRepresentation(
    this: void,
    group: GroupRepresentation
  ): group is SafeGroupRepresentation {
    return !!group.id && !!group.path;
  }

  private static warnIfUserFetchLimitReached(
    users: UserRepresentation[]
  ): void {
    if (users.length >= this.USER_FETCH_LIMIT) {
      console.warn(
        'AccountService: Got ' +
          users.length.toString() +
          ' users from authserver. There may be more, but the limit is fixed. If you read this open an issue to add pagination.'
      );
    }
  }
}
