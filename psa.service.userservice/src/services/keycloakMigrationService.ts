/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import crypto from 'crypto';
import { getRepository } from 'typeorm';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { RoleMappingPayload } from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import { RequiredActionAlias } from '@keycloak/keycloak-admin-client/lib/defs/requiredActionProviderRepresentation';
import { AuthServerClient } from '@pia-system/lib-auth-server-client';
import { Role as RoleWithoutSysAdmin } from '@pia-system/lib-http-clients-internal';
import * as util from 'util';
import { Account } from '../entities/account';
import { Study } from '../entities/study';
import { Proband } from '../entities/proband';
import assert from 'assert';
import { personaldataserviceClient } from '../clients/personaldataserviceClient';
import Joi from 'joi';
import {
  adminAuthClient,
  probandAuthClient,
} from '../clients/authServerClient';
import { StudyAccess } from '../entities/studyAccess';

type Role = RoleWithoutSysAdmin | 'SysAdmin';

const sleep = util.promisify(setTimeout);

interface KeycloakPasswordCredential {
  type: 'password';
  secretData: string;
  credentialData: string;
}

interface Mapping<T, U> {
  proband: Map<T, U>;
  professional: Map<T, U>;
}

type GroupMapping = Mapping<string, string>;
type RoleMapping = Mapping<Role, RoleMappingPayload>;

type KeycloakUser = UserRepresentation & { realm: string; username: string };

export interface UserSpec {
  user: KeycloakUser;
  groupIds: string[];
  role: RoleMappingPayload;
}

export class AuthUserClient {
  public constructor(private readonly authClient: AuthServerClient) {}

  public async createUserFromSpec(spec: UserSpec): Promise<void> {
    const id = await this.findOrCreateKeycloakUser(spec.user);

    // migrated users with non-empty password should not be forced to update their password
    if (
      !spec.user.requiredActions?.includes(RequiredActionAlias.UPDATE_PASSWORD)
    ) {
      await this.removeRequiredAction(id, RequiredActionAlias.UPDATE_PASSWORD);
    }
    await this.addMissingGroups(id, spec.groupIds);
    await this.addMissingRealmRoleMappings(id, [spec.role]);
  }

  private async addMissingGroups(
    id: string,
    groupIds: string[]
  ): Promise<void> {
    const existing = await this.authClient.users.listGroups({
      id,
      realm: this.authClient.realm,
    });
    const existingIds = existing.map((g) => g.id);
    const newGroups = groupIds.filter((g) => !existingIds.includes(g));

    for (const groupId of newGroups) {
      await this.authClient.users.addToGroup({
        id,
        groupId,
        realm: this.authClient.realm,
      });
    }
  }

  private async addMissingRealmRoleMappings(
    id: string,
    roles: RoleMappingPayload[]
  ): Promise<void> {
    const existing = await this.authClient.users.listRealmRoleMappings({
      id,
      realm: this.authClient.realm,
    });
    const newRoles = roles.filter((r) => !existing.find((e) => e.id === r.id));

    if (roles.length > 0) {
      await this.authClient.users.addRealmRoleMappings({
        id,
        realm: this.authClient.realm,
        roles: newRoles,
      });
    }
  }

  private async removeRequiredAction(
    userId: string,
    requiredAction: RequiredActionAlias
  ): Promise<void> {
    const userQuery: { id: string; realm: string } = {
      id: userId,
      realm: this.authClient.realm,
    };
    const found = await this.authClient.users.findOne(userQuery);

    if (found?.requiredActions?.includes(requiredAction)) {
      found.requiredActions = found.requiredActions.filter((action) => {
        return action !== requiredAction;
      });
      await this.authClient.users.update(userQuery, found);
    }
  }

  private async findOrCreateKeycloakUser(user: KeycloakUser): Promise<string> {
    const users = await this.authClient.users.find({
      username: user.username,
      realm: user.realm,
    });
    const found = users.find((u) => u.username === user.username);
    if (found) {
      assert(
        found.id,
        `user ${user.username} is found in keycloak but is missing the id`
      );
      return found.id;
    }

    const { id } = await this.authClient.users.create(user);
    return id;
  }
}

interface KeycloakUserSpec {
  user: KeycloakUser;
  groupIds: string[];
  role: RoleMappingPayload;
}

const professionalRoles: Role[] = [
  'EinwilligungsManager',
  'Forscher',
  'ProbandenManager',
  'Untersuchungsteam',
  'SysAdmin',
];

const probandRoles: Role[] = ['Proband'];

const probandAuthUserClient = new AuthUserClient(probandAuthClient);
const adminAuthUserClient = new AuthUserClient(adminAuthClient);

function realmClient(realmId: string): AuthServerClient {
  return realmId === probandAuthClient.realm
    ? probandAuthClient
    : adminAuthClient;
}

function realmUserClient(realmId: string): AuthUserClient {
  return realmId === probandAuthClient.realm
    ? probandAuthUserClient
    : adminAuthUserClient;
}

class StudySpecCreater {
  public static async getStudySpecs(): Promise<string[]> {
    const studyRepo = getRepository(Study);
    const studies = await studyRepo.find();
    return studies.map((study) => study.name);
  }
}

class UserSpecCreater {
  private static readonly HASH_ITERATIONS = 100000;
  private static readonly PEPPER = 'supersalt';

  public static async getUserSpec(
    account: Account,
    groups: GroupMapping,
    roles: RoleMapping
  ): Promise<KeycloakUserSpec> {
    if (account.role === 'Proband') {
      return await this.getProbandUserSpec(account, groups, roles);
    } else {
      return await this.getProfessionalUserSpec(account, groups, roles);
    }
  }

  private static async getProbandUserSpec(
    account: Account,
    groups: GroupMapping,
    roles: RoleMapping
  ): Promise<KeycloakUserSpec> {
    const probandRepo = getRepository(Proband);
    const proband = await probandRepo.findOneOrFail({
      where: {
        pseudonym: account.username,
      },
      relations: ['study'],
    });

    if (!proband.study) {
      throw new Error(
        `unable to find proband study for account ${account.username}`
      );
    }

    const groupId = groups.proband.get(proband.study.name);
    if (!groupId) {
      throw new Error(`unable to find groupId for study ${proband.study.name}`);
    }

    const role = roles.proband.get(account.role);
    if (!role) {
      throw new Error(
        `unable to find role ${account.role} for ${account.username}`
      );
    }

    const email = await personaldataserviceClient.getPersonalDataEmail(
      account.username
    );

    return {
      user: UserSpecCreater.makeKeycloakUser(
        account,
        email ?? undefined,
        probandAuthClient.realm
      ),
      groupIds: [groupId],
      role,
    };
  }

  private static async getProfessionalUserSpec(
    account: Account,
    groups: GroupMapping,
    roles: RoleMapping
  ): Promise<KeycloakUserSpec> {
    const studyAccessRepository = getRepository(StudyAccess);
    const studies = await studyAccessRepository.find({
      where: {
        username: account.username,
      },
    });

    const groupIds = studies.map((study) => {
      const groupId = groups.professional.get(study.studyName);
      if (!groupId) {
        throw new Error(`unable to find groupId for study ${study.studyName}`);
      }
      return groupId;
    });

    const role = roles.professional.get(account.role);
    if (!role) {
      throw new Error(
        `unable to find role ${account.role} for ${account.username}`
      );
    }

    let email: string | undefined;
    if (!Joi.string().email().validate(account.username).error) {
      email = account.username;
    }

    return {
      user: UserSpecCreater.makeKeycloakUser(
        account,
        email,
        adminAuthClient.realm
      ),
      groupIds,
      role,
    };
  }

  private static hashPasswordWithSaltAndPepper(
    password: string,
    salt: string
  ): string {
    const KEY_LENGTH = 128;
    const saltPepper = salt + '' + UserSpecCreater.PEPPER;
    const key = crypto.pbkdf2Sync(
      password,
      saltPepper,
      UserSpecCreater.HASH_ITERATIONS,
      KEY_LENGTH,
      'sha512'
    );
    return key.toString('hex');
  }

  private static isEmptyPassword(password: string, salt: string): boolean {
    return password === this.hashPasswordWithSaltAndPepper('', salt);
  }

  private static makeKeycloakCredential(
    this: void,
    hashHex: string,
    saltHex: string
  ): KeycloakPasswordCredential {
    const hash = Buffer.from(hashHex, 'hex');
    const salt = Buffer.from(saltHex + UserSpecCreater.PEPPER, 'utf8');

    return {
      type: 'password',
      secretData: JSON.stringify({
        value: hash.toString('base64'),
        salt: salt.toString('base64'),
      }),
      credentialData: JSON.stringify({
        hashIterations: UserSpecCreater.HASH_ITERATIONS,
        algorithm: 'pbkdf2-sha512',
      }),
    };
  }

  private static makeKeycloakUser(
    this: void,
    account: Account,
    email: string | undefined,
    realm: string
  ): KeycloakUser {
    const credentials: KeycloakPasswordCredential[] = [];
    let isPasswordChangeNeeded = false;

    if (account.salt && account.salt !== '') {
      /**
       * This will migrate empty passwords to the username as password
       * and will also force a password change on next login
       */
      if (UserSpecCreater.isEmptyPassword(account.password, account.salt)) {
        isPasswordChangeNeeded = true;
        account.password = UserSpecCreater.hashPasswordWithSaltAndPepper(
          account.username,
          account.salt
        );
      }

      credentials.push(
        UserSpecCreater.makeKeycloakCredential(account.password, account.salt)
      );
    }
    return {
      username: account.username,
      enabled: true,
      credentials,
      realm,
      requiredActions: isPasswordChangeNeeded
        ? [RequiredActionAlias.UPDATE_PASSWORD]
        : [],
      email,
    };
  }
}

class StudyMigration {
  public async migrateStudies(studies: string[]): Promise<GroupMapping> {
    const proband = await this.createStudies(probandAuthClient.realm, studies);
    const professional = await this.createStudies(
      adminAuthClient.realm,
      studies
    );
    return {
      proband,
      professional,
    };
  }

  private async createStudies(
    realm: string,
    studies: string[]
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const keycloakGroups = await realmClient(realm).groups.find({ realm });
    const keycloakGroupNames = keycloakGroups.map((group) => group.name);

    const missingStudies = studies.filter(
      (study) => !keycloakGroupNames.includes(study)
    );

    const existingStudies = studies.filter((study) =>
      keycloakGroupNames.includes(study)
    );

    for (const missingStudy of missingStudies) {
      const { id } = await realmClient(realm).groups.create({
        name: missingStudy,
        realm,
      });

      result.set(missingStudy, id);
    }
    for (const existingStudy of existingStudies) {
      const keycloakGroup = keycloakGroups.find(
        (group) => group.name === existingStudy
      );
      if (!keycloakGroup || !keycloakGroup.id) {
        throw new Error(
          `unable to find id for group ${existingStudy} in ${realm}`
        );
      }
      result.set(existingStudy, keycloakGroup.id);
    }
    console.log(`realm ${realm} now has the following groups`, result);
    return result;
  }
}

class RoleMigration {
  public async getRoles(): Promise<RoleMapping> {
    return {
      proband: await this.getRealmRoles(probandRoles, probandAuthClient.realm),
      professional: await this.getRealmRoles(
        professionalRoles,
        adminAuthClient.realm
      ),
    };
  }

  private async getRealmRoles(
    roles: Role[],
    realm: string
  ): Promise<Map<Role, RoleMappingPayload>> {
    const result = new Map<Role, RoleMappingPayload>();
    for (const role of roles) {
      const kcRole = await realmClient(realm).roles.findOneByName({
        name: role,
        realm,
      });
      assert(kcRole, `unable to find role ${role} in ${realm}`);

      const id = kcRole.id;
      const name = kcRole.name;

      assert(
        typeof id === 'string',
        `role ${role} in ${realm} is missing the id property`
      );
      assert(
        typeof name === 'string',
        `role ${role} in ${realm} is missing the name property`
      );

      result.set(role, {
        id,
        name,
      });
    }
    return result;
  }
}

/**
 * @deprecated only for one-time migration of existing users
 */
export class KeycloakMigrationService {
  private readonly studyMigration = new StudyMigration();

  private readonly roleMigration = new RoleMigration();

  private readonly accountRepo = getRepository(Account);

  public async migrate(): Promise<void> {
    if (process.env['NODE_ENV'] === 'test') {
      console.log('skipping migration');
      return;
    }

    console.log('starting migration...');

    // wait for services
    await personaldataserviceClient.waitForService();

    // give kc some more time... got some java.lang.NullPointerException without it... :-/
    const additionalWaitTime = 25_000;
    console.log(`waiting additional ${additionalWaitTime}ms for Keycloak`);
    await sleep(additionalWaitTime);

    const studies = await StudySpecCreater.getStudySpecs();

    const roles = await this.roleMigration.getRoles();
    const groups = await this.studyMigration.migrateStudies(studies);

    await this.migrateUsers(groups, roles);
  }

  private async migrateUsers(
    groups: GroupMapping,
    roles: RoleMapping
  ): Promise<void> {
    let result = {
      successfull: 0,
      failed: 0,
    };
    for (;;) {
      const accounts = await this.accountRepo.find({
        where: {
          isMigrated: null,
        },
        take: 100,
      });

      if (accounts.length === 0) {
        break;
      }
      const userMigrations = accounts.map(async (account) => {
        return this.migrateUser(account, groups, roles);
      });

      const migrationResult = await Promise.all(userMigrations);
      result = migrationResult.reduce((r, c) => {
        if (c) {
          r.successfull++;
        } else {
          r.failed++;
        }
        return r;
      }, result);

      console.log(
        `migration in progress: ${result.successfull} successfull, ${result.failed} failed...`
      );
    }
    console.log(
      `migration done: ${result.successfull} successfull, ${result.failed} failed...`
    );
  }

  private async migrateUser(
    account: Account,
    groups: GroupMapping,
    roles: RoleMapping
  ): Promise<boolean> {
    let isMigrated = false;
    try {
      const userSpec = await UserSpecCreater.getUserSpec(
        account,
        groups,
        roles
      );
      const userAuthClient = realmUserClient(userSpec.user.realm);
      await userAuthClient.createUserFromSpec(userSpec);
      isMigrated = true;
    } catch (err) {
      console.log(`error migrating ${account.username}:`, err);
    }

    await this.accountRepo.update(account.username, {
      isMigrated,
    });
    return isMigrated;
  }
}
