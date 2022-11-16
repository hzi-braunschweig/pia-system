/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StudyAccessOfUser } from '../models/user';
import { adminAuthClient } from '../clients/authServerClient';
import { ProfessionalRole, professionalRoles } from '../models/role';
import { ProfessionalAccount } from '../models/account';
import { asyncMap } from '@pia/lib-service-core';
import { AccountService, SafeUserRepresentation } from './accountService';

export interface Page {
  first: number; // item to begin at
  size: number; // count of items
}

/**
 * Manages admin accounts in authserver
 */
export class ProfessionalAccountService extends AccountService {
  public static async getProfessionalAccount(
    username: string
  ): Promise<ProfessionalAccount> {
    return await this.mapSafeUserRepresentationToProfessionalAccount(
      await this.getUserOrFail(username, adminAuthClient)
    );
  }

  /**
   * Returns all professional accounts.
   *
   * Request may take long if more than 50 users are fetched at the same time.
   * Use pagination or the more specific APIs
   * {@link ProfessionalAccountService#getProfessionalAccountsByStudyName} or
   * {@link ProfessionalAccountService#getProfessionalAccountsByRole}
   *
   * @param page description of the page to fetch
   */
  public static async getProfessionalAccounts(
    page: Page = { first: 0, size: this.USER_FETCH_LIMIT }
  ): Promise<ProfessionalAccount[]> {
    const users = (
      await adminAuthClient.users.find({
        first: page.first,
        max: page.size,
        realm: adminAuthClient.realm,
      })
    ).filter(this.isSafeUserRepresentation);

    return await asyncMap(users, async (user) =>
      this.mapSafeUserRepresentationToProfessionalAccount(user)
    );
  }

  public static async getProfessionalAccountsByStudyName(
    studyName: string
  ): Promise<ProfessionalAccount[]> {
    const users = await this.getAccountsByStudyName(studyName, adminAuthClient);

    return await asyncMap(users, async (user) =>
      this.mapSafeUserRepresentationToProfessionalAccount(user)
    );
  }

  public static async getProfessionalAccountsByRole(
    role: ProfessionalRole
  ): Promise<ProfessionalAccount[]> {
    const users = await this.getAccountsByRole(role, adminAuthClient);

    return await asyncMap(users, async (user) => ({
      username: user.username,
      role,
      studies: await this.getGroupNamesByUserId(user.id, adminAuthClient),
    }));
  }

  public static async getPrimaryRoleOfProfessional(
    username: string
  ): Promise<ProfessionalRole> {
    const { id } = await this.getUserOrFail(username, adminAuthClient);
    return this.getPrimaryRoleByUserId(id);
  }

  public static async isProfessionalAccount(
    username: string
  ): Promise<boolean> {
    return (
      (await adminAuthClient.users.count({
        username,
        realm: adminAuthClient.realm,
      })) > 0
    );
  }

  public static async createProfessionalAccount(
    username: string,
    role: ProfessionalRole,
    studyAccesses: StudyAccessOfUser[],
    password: string,
    temporaryPassword: boolean
  ): Promise<void> {
    await this.createAccount(
      {
        username,
        email: username,
        role,
        studies: studyAccesses.map((access) => access.study_id),
        password,
      },
      adminAuthClient,
      temporaryPassword
    );
  }

  public static async grantStudyAccess(
    username: string,
    studyName: string
  ): Promise<void> {
    const user = await this.getUserOrFail(username, adminAuthClient);
    const group = await this.getGroupByNameOrFail(studyName, adminAuthClient);
    await adminAuthClient.users.addToGroup({
      id: user.id,
      groupId: group.id,
      realm: adminAuthClient.realm,
    });
  }

  public static async revokeStudyAccess(
    username: string,
    studyName: string
  ): Promise<void> {
    const user = await this.getUserOrFail(username, adminAuthClient);
    const group = await this.getGroupByNameOrFail(studyName, adminAuthClient);
    await adminAuthClient.users.delFromGroup({
      id: user.id,
      groupId: group.id,
      realm: adminAuthClient.realm,
    });
  }

  public static async deleteProfessionalAccount(
    username: string
  ): Promise<void> {
    const { id } = await this.getUserOrFail(username, adminAuthClient);
    await adminAuthClient.users.del({ id, realm: adminAuthClient.realm });
  }

  public static async createStudy(studyName: string): Promise<void> {
    await this.createGroup(studyName, adminAuthClient);
  }

  public static async deleteStudy(studyName: string): Promise<void> {
    await this.deleteGroupByName(studyName, adminAuthClient);
  }

  public static async hasGroupRealmRoleMapping(
    roleName: string,
    groupName: string
  ): Promise<boolean> {
    const { id } = await this.getGroupByNameOrFail(groupName, adminAuthClient);
    const roles = await adminAuthClient.groups.listRealmRoleMappings({
      id,
      realm: adminAuthClient.realm,
    });
    return roles.some((role) => role.name === roleName);
  }

  public static async addRealmRoleMappingToGroup(
    roleName: string,
    groupName: string
  ): Promise<void> {
    const { id } = await this.getGroupByNameOrFail(groupName, adminAuthClient);
    const role = await this.getRole(roleName, adminAuthClient);
    await adminAuthClient.groups.addRealmRoleMappings({
      id,
      roles: [role],
      realm: adminAuthClient.realm,
    });
  }

  public static async removeRealmRoleMappingFromGroup(
    roleName: string,
    groupName: string
  ): Promise<void> {
    const { id } = await this.getGroupByNameOrFail(groupName, adminAuthClient);
    const role = await this.getRole(roleName, adminAuthClient);
    await adminAuthClient.groups.delRealmRoleMappings({
      id,
      roles: [role],
      realm: adminAuthClient.realm,
    });
  }

  private static async getPrimaryRoleByUserId(
    id: string
  ): Promise<ProfessionalRole> {
    const realmRoles = await adminAuthClient.users.listRealmRoleMappings({
      id,
      realm: adminAuthClient.realm,
    });
    const foundRole = realmRoles.find(
      (role) => role.name && this.isProfessionalRole(role.name)
    );
    if (
      !foundRole ||
      !foundRole.name ||
      !this.isProfessionalRole(foundRole.name)
    ) {
      throw Error('user has no role assigned');
    }
    return foundRole.name;
  }

  private static async mapSafeUserRepresentationToProfessionalAccount(
    user: SafeUserRepresentation
  ): Promise<ProfessionalAccount> {
    return {
      username: user.username,
      role: await this.getPrimaryRoleByUserId(user.id),
      studies: await this.getGroupNamesByUserId(user.id, adminAuthClient),
    };
  }

  private static isProfessionalRole(
    this: void,
    role: string
  ): role is ProfessionalRole {
    return professionalRoles.includes(role as ProfessionalRole);
  }
}
