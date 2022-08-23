/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import Joi from 'joi';

import postgresqlHelper from '../services/postgresqlHelper';
import {
  AccessToken,
  asyncMap,
  getPrimaryRealmRole,
  MailService,
} from '@pia/lib-service-core';
import { MailTemplateService } from '../services/mailTemplateService';
import { SecureRandomPasswordService } from '../services/secureRandomPasswordService';
import { CreateProfessionalUser } from '../models/user';
import { ProfessionalRole, professionalRoles } from '../models/role';
import { ProbandDto } from '../models/proband';
import { ProfessionalAccountService } from '../services/professionalAccountService';
import { ProfessionalAccount } from '../models/account';
import { AccessLevel } from '@pia-system/lib-http-clients-internal';
import { getRepository, In } from 'typeorm';
import { StudyAccess } from '../entities/studyAccess';
import { AccountAlreadyExistsError } from '../errors';
import { FindConditions } from 'typeorm/find-options/FindConditions';
import { ProbandService } from '../services/probandService';

export interface GetProfessionalAccountsFilters {
  studyName?: string;
  role?: ProfessionalRole;
  accessLevel?: AccessLevel;
  onlyMailAddresses?: boolean;
  filterSelf?: boolean;
}

/**
 * @description interactor that handles user requests based on users permissions
 */
export class UsersInteractor {
  /**
   * Gets all users with the same role as a requester
   */
  public static async getProfessionalAccounts(
    decodedToken: AccessToken,
    filters: GetProfessionalAccountsFilters
  ): Promise<ProfessionalAccount[]> {
    const userRole = getPrimaryRealmRole(decodedToken) as ProfessionalRole;
    let accounts: ProfessionalAccount[];

    if (userRole !== 'SysAdmin') {
      // Non SysAdmins may only see accounts of the same role
      filters.role = userRole;
    }

    if (filters.studyName) {
      if (
        userRole !== 'SysAdmin' &&
        !decodedToken.studies.includes(filters.studyName)
      ) {
        throw Boom.forbidden(
          `user has no access to study "${filters.studyName}"`
        );
      }
      accounts =
        await ProfessionalAccountService.getProfessionalAccountsByStudyName(
          filters.studyName
        );

      if (filters.role) {
        accounts = accounts.filter((account) => account.role === filters.role);
      }
    } else {
      if (userRole !== 'SysAdmin') {
        throw Boom.forbidden(`study must be defined for role "${userRole}"`);
      }
      /**
       * This is mainly a performance optimization. If we know the role beforehand, we
       * do not need to additionally fetch roles for each user.
       */
      accounts = (
        await asyncMap(
          filters.role ? [filters.role] : professionalRoles,
          async (role) =>
            await ProfessionalAccountService.getProfessionalAccountsByRole(role)
        )
      ).flat();
    }

    if (filters.onlyMailAddresses) {
      accounts = accounts.filter((account) =>
        this.isValidMail(account.username)
      );
    }

    if (filters.filterSelf) {
      accounts = accounts.filter(
        (account) => account.username !== decodedToken.username
      );
    }

    if (filters.accessLevel) {
      const studyAccessesSet = new Set(
        (
          await getRepository(StudyAccess).find(
            UsersInteractor.buildStudyAccessFindConditions(accounts, filters)
          )
        ).map((access) => access.username)
      );

      accounts = accounts.filter((account) =>
        studyAccessesSet.has(account.username)
      );
    }
    return accounts;
  }

  /**
   * Gets a user from DB if user is allowed to
   */
  public static async getProbandAsProfessional(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<ProbandDto> {
    try {
      return await ProbandService.getProbandByPseudonymOrFail(
        pseudonym,
        decodedToken.studies
      );
    } catch (err) {
      console.log(err);
      throw Boom.notFound(
        'The proband with the given pseudonym does not exist or user has no access'
      );
    }
  }

  /**
   * Gets a user by ids from DB if requester is allowed to
   */
  public static async getProbandByIDS(
    decodedToken: AccessToken,
    ids: string
  ): Promise<ProbandDto> {
    try {
      return await ProbandService.getProbandByIdsOrFail(
        ids,
        decodedToken.studies
      );
    } catch (e) {
      throw Boom.notFound(
        'The proband with the given IDS does not exist or user has no access'
      );
    }
  }

  /**
   * Creates the user in authserver if it does not exist and the requester is allowed to
   */
  public static async createProfessionalUser(
    user: CreateProfessionalUser
  ): Promise<void> {
    if (await ProfessionalAccountService.isProfessionalAccount(user.username)) {
      throw new AccountAlreadyExistsError(
        'account with username "' + user.username + '" already exists'
      );
    }

    await postgresqlHelper.insertStudyAccessesWithAccessLevel(
      user.study_accesses,
      user.username
    );

    const password = SecureRandomPasswordService.generate();

    await ProfessionalAccountService.createProfessionalAccount(
      user.username,
      user.role,
      user.study_accesses,
      password,
      user.temporaryPassword ?? true
    );

    await MailService.sendMail(
      user.username,
      MailTemplateService.createRegistrationMail(password, user.role)
    );
  }

  /**
   * Performs changes on Probands attributes like is_test_proband
   */
  public static async updateProband(
    decodedToken: AccessToken,
    pseudonym: string,
    userValues: { is_test_proband?: boolean }
  ): Promise<void> {
    if (userValues.is_test_proband === undefined) {
      throw Boom.badData('payload incorrect');
    }
    await postgresqlHelper.changeTestProbandState(
      pseudonym,
      userValues.is_test_proband,
      decodedToken.studies
    );
  }

  public static async deleteProfessionalUser(username: string): Promise<void> {
    if (
      (await ProfessionalAccountService.getPrimaryRoleOfProfessional(
        username
      )) === 'SysAdmin'
    ) {
      throw Boom.forbidden('SysAdmins cannot delete other SysAdmins');
    }
    await getRepository(StudyAccess).delete({
      username,
    });
    await ProfessionalAccountService.deleteProfessionalAccount(username);
  }

  private static isValidMail(value: string): boolean {
    return !Joi.string().email().validate(value).error;
  }

  private static buildStudyAccessFindConditions(
    accounts: ProfessionalAccount[],
    filters: GetProfessionalAccountsFilters
  ): FindConditions<StudyAccess> {
    return {
      ...(filters.studyName && { studyName: filters.studyName }),
      username: In(accounts.map((account) => account.username)),
      accessLevel: filters.accessLevel,
    };
  }
}
