/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import postgresqlHelper from '../services/postgresqlHelper';
import { AccessToken, MailService } from '@pia/lib-service-core';
import mailTemplateService from '../services/mailTemplateService';
import { SecureRandomPasswordService } from '../services/secureRandomPasswordService';
import { authserviceClient } from '../clients/authserviceClient';
import { CreateProfessionalUser, ProfessionalUser } from '../models/user';
import pgPromise from 'pg-promise';
import { ProfessionalRole } from '../models/role';
import { ProbandResponse } from '../models/proband';
import { ProbandsRepository } from '../repositories/probandsRepository';
import QueryResultError = pgPromise.errors.QueryResultError;
import queryResultErrorCode = pgPromise.errors.queryResultErrorCode;

/**
 * @description interactor that handles user requests based on users permissions
 */
export class UsersInteractor {
  /**
   * gets a user from DB if user is allowed to
   * @param decodedToken the decoded jwt of the request
   * @param pseudonym the pseudonym of the user to get
   */
  public static async getProband(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<ProbandResponse> {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;
    const userStudies = decodedToken.groups;

    switch (userRole) {
      case 'Forscher':
      case 'Untersuchungsteam':
      case 'ProbandenManager':
        try {
          return await ProbandsRepository.getProbandAsProfessional(
            pseudonym,
            userStudies
          );
        } catch (err) {
          console.log(err);
          throw Boom.notFound('Could not get user, because user has no access');
        }
      case 'Proband':
        if (userName === pseudonym) {
          return (
            (await ProbandsRepository.getProband(pseudonym)) ??
            (await Promise.reject(Boom.notFound('Could not get user')))
          );
        } else {
          throw Boom.forbidden('Probands can only get themself');
        }
      default:
        throw Boom.forbidden('Could not get the user: Unknown or wrong role');
    }
  }

  /**
   * gets a user by ids from DB if requester is allowed to
   * @param decodedToken the decoded jwt of the request
   * @param ids the ids of the user
   */
  public static async getProbandByIDS(
    decodedToken: AccessToken,
    ids: string
  ): Promise<ProbandResponse> {
    const userRole = decodedToken.role;
    const userStudies = decodedToken.groups;

    if (userRole !== 'Untersuchungsteam') {
      throw Boom.forbidden('Could not get the user: Unknown or wrong role');
    }
    const user = await ProbandsRepository.getProbandByIdsAsProfessional(
      ids,
      userStudies
    );
    if (user) {
      return user;
    } else {
      throw Boom.notFound(
        "The user with the given IDS does not exist or you don't have the permission"
      );
    }
  }

  /**
   * gets all users from DB the user has access to
   * @param decodedToken the decoded jwt of the request
   */
  public static async getUsers(
    decodedToken: AccessToken
  ): Promise<ProbandResponse[] | ProfessionalUser[]> {
    const userRole = decodedToken.role;
    const userStudies = decodedToken.groups;

    switch (userRole) {
      case 'ProbandenManager':
      case 'Untersuchungsteam':
      case 'Forscher':
        return await ProbandsRepository.getProbandsAsProfessional(userStudies);
      case 'SysAdmin':
        return (await postgresqlHelper.getUsersForSysAdmin()) as ProfessionalUser[];
      default:
        throw Boom.forbidden('Could not get the user: Unknown or wrong role');
    }
  }

  /**
   * gets all users with the same role as a requester
   * @param decodedToken the decoded jwt of the request
   */
  public static async getUsersWithSameRole(
    decodedToken: AccessToken
  ): Promise<ProfessionalUser[]> {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'ProbandenManager':
      case 'Untersuchungsteam':
      case 'Forscher':
      case 'SysAdmin':
        return (await postgresqlHelper.getUsersWithSameRole(
          userName,
          userRole
        )) as ProfessionalUser[];
      default:
        throw Boom.forbidden('Could not get the user: Unknown or wrong role');
    }
  }

  /**
   * creates the user in DB if it does not exist and the requester is allowed to
   * @param decodedToken the decoded jwt of the request
   * @param user the user object to create
   */
  public static async createUser(
    decodedToken: AccessToken,
    user: CreateProfessionalUser
  ): Promise<void> {
    const userRole = decodedToken.role;

    if (userRole !== 'SysAdmin') {
      throw Boom.forbidden('Could not create the user: Unknown or wrong role');
    }

    const password = SecureRandomPasswordService.generate();

    await authserviceClient.createAccount({
      username: user.username,
      role: user.role,
      password: password,
      pwChangeNeeded: true,
    });

    await MailService.sendMail(
      user.username,
      mailTemplateService.createRegistrationMail(password, user.role)
    );

    await postgresqlHelper.insertStudyAccessesWithAccessLevel(
      user.study_accesses,
      user.username
    );
  }

  /**
   * Performs changes on Probands attributes like is_test_proband
   * @param decodedToken the decoded jwt of the request
   * @param username the name of the user that should be updated
   * @param userValues the values age and gender to change
   */
  public static async updateUser(
    decodedToken: AccessToken,
    username: string,
    userValues: { is_test_proband?: boolean }
  ): Promise<void> {
    const userRole = decodedToken.role;
    const userStudies = decodedToken.groups;

    if (userRole !== 'Untersuchungsteam') {
      throw Boom.forbidden('Wrong role for this command');
    }
    if (userValues.is_test_proband === undefined) {
      throw Boom.badData('payload incorrect');
    }
    await postgresqlHelper.changeTestProbandState(
      username,
      userValues.is_test_proband,
      userStudies
    );
  }

  /**
   * deletes a professional user and all its data from DB if requesting user is allowed to
   * @param decodedToken the decoded jwt of the request
   * @param username the id of the user to delete
   */
  public static async deleteUser(
    decodedToken: AccessToken,
    username: string
  ): Promise<{
    username: string;
    role: ProfessionalRole;
    first_logged_in_at: Date | null;
  }> {
    const userRole = decodedToken.role;

    if (userRole !== 'SysAdmin') {
      throw Boom.forbidden('Could not delete the user: Unknown or wrong role');
    }
    try {
      return (await postgresqlHelper.deleteUser(username)) as {
        username: string;
        role: ProfessionalRole;
        first_logged_in_at: Date | null;
      };
    } catch (err) {
      if (
        err instanceof QueryResultError &&
        err.code === queryResultErrorCode.noData
      ) {
        throw Boom.notFound('Could not find the user that should be deleted.');
      }
      throw err;
    }
  }
}
