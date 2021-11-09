/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { runTransaction } from '../db';
import postgresqlHelper from '../services/postgresqlHelper';
import { AccessToken, MailService } from '@pia/lib-service-core';
import mailTemplateService from '../services/mailTemplateService';
import { SecureRandomPasswordService } from '../services/secureRandomPasswordService';
import { generateRandomPseudonym } from '../helpers/pseudonym-generator';
import sormasserviceClient from '../clients/sormasserviceClient';
import { AuthserviceClient } from '../clients/authserviceClient';
import personaldataserviceClient from '../clients/personaldataserviceClient';
import {
  AccountStatus,
  CreateUserRequest,
  ProbandResponseForPm,
  ProbandResponseForProfessionals,
  User,
  UserResponse,
  UserWithStudyAccess,
} from '../models/user';
import pgPromise from 'pg-promise';
import { ProfessionalRole } from '../models/role';
import QueryResultError = pgPromise.errors.QueryResultError;
import queryResultErrorCode = pgPromise.errors.queryResultErrorCode;

/**
 * @description interactor that handles user requests based on users permissions
 */
export class UsersInteractor {
  /**
   * gets a user from DB if user is allowed to
   * @param decodedToken the decoded jwt of the request
   * @param id the id of the user to get
   */
  public static async getUser(
    decodedToken: AccessToken,
    id: string
  ): Promise<UserResponse> {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Forscher':
      case 'Untersuchungsteam':
      case 'ProbandenManager':
        return (await postgresqlHelper
          .getUserAsProfessional(id, userName)
          .catch((err) => {
            console.log(err);
            throw Boom.notFound(
              'Could not get user, because user has no access'
            );
          })) as UserResponse;
      case 'Proband':
        if (userName === id) {
          return (await postgresqlHelper.getUser(id)) as UserResponse;
        } else {
          throw Boom.forbidden('Probands can only get themself');
        }
      default:
        throw Boom.forbidden('Could not get the user: Unknown or wrong role');
    }
  }

  /**
   * gets a user by ids from DB if requester is allowed to
   * @param ids
   * @param requesterUsername
   */
  public static async getUserByIDS(
    ids: string,
    requesterUsername: string
  ): Promise<User> {
    const user = (await postgresqlHelper.getUserAsProfessionalByIDS(
      ids,
      requesterUsername
    )) as User | null;
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
  ): Promise<ProbandResponseForProfessionals[] | UserResponse[]> {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'ProbandenManager':
        return (await postgresqlHelper.getUsersForPM(
          userName
        )) as ProbandResponseForPm[];
      case 'Untersuchungsteam':
      case 'Forscher':
        return (await postgresqlHelper.getUsersForProfessional(
          userName
        )) as ProbandResponseForProfessionals[];
      case 'SysAdmin':
        return (await postgresqlHelper.getUsersForSysAdmin()) as UserResponse[];
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
  ): Promise<UserResponse[]> {
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
        )) as UserResponse[];
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
    user: CreateUserRequest
  ): Promise<UserWithStudyAccess> {
    const userRole = decodedToken.role;

    if (userRole !== 'SysAdmin') {
      throw Boom.forbidden('Could not create the user: Unknown or wrong role');
    }

    const password = SecureRandomPasswordService.generate();

    const result = await AuthserviceClient.createUser({
      username: user.username,
      role: user.role,
      password: password,
      account_status: 'active',
      pw_change_needed: true,
    });

    await MailService.sendMail(
      user.username,
      mailTemplateService.createRegistrationMail(password, user.role)
    );

    await postgresqlHelper.insertStudyAccessesWithAccessLevel(
      user.study_accesses,
      user.username
    );

    // send infos back to the ui:
    // but we don't want to send the password!
    return {
      ...result,
      study_accesses: user.study_accesses,
    };
  }

  /* eslint-disable */
  /**
   * creates the user in DB if it does not exist and the requester is allowed to
   * @param username
   * @param data the user object to create
   * @return {Promise<{password: string, resultURL: string, pseudonym: *}|*>}
   */
  // @ts-ignore
  public static async createSormasProband(username, data) {
    const requester = await postgresqlHelper.getUser(username);

    // For all studies check, if the requester has access
    for (const study of data.study_accesses) {
      if (
        // @ts-ignore
        !requester.study_accesses.some((accessR) => accessR.study_id === study)
      ) {
        return Boom.forbidden('You do not have access to the study: ' + study);
      }
    }

    // Check that ids does not already exist
    if (await postgresqlHelper.isUserExistentByIds(data.uuid)) {
      return Boom.conflict(`The IDS/UUID ${data.uuid} is already in use.`);
    }

    // Create a pseudonym by using prefix and suffix-length defined in the study
    if (data.study_accesses.length !== 1) {
      throw new Error(
        'More than one studies are currently not supported for Sormas'
      );
    }
    const primaryStudy = await postgresqlHelper.getStudy(
      data.study_accesses[0]
    );
    let generatedPseudonym;
    let counter = 0;
    do {
      counter++;
      if (counter > 1000) {
        throw new Error(
          'It seems to be impossible to generate a unused Pseudonym. I tried a thousand times.'
        );
      }
      generatedPseudonym = generateRandomPseudonym(
        primaryStudy.pseudonym_prefix,
        primaryStudy.pseudonym_suffix_length
      );
    } while (
      await postgresqlHelper.isUserExistentByUsername(generatedPseudonym)
    ); // if it exists, create a new one
    data.pseudonym = generatedPseudonym;

    // Create a random password
    const generatedPassword = SecureRandomPasswordService.generate();
    data.password = generatedPassword;

    const user = {
      username: data.pseudonym,
      password: data.password,
      role: 'Proband',
      pw_change_needed: true,
      initial_password_validity_date:
        SecureRandomPasswordService.generateInitialPasswordValidityDate(),
      account_status: 'active',
    };

    // @ts-ignore
    await AuthserviceClient.createUser(user);

    await runTransaction(async (transaction) => {
      // Store the new proband in db
      await postgresqlHelper.createSormasProband(data, { transaction });

      // Report this to SORMAS
      console.log('Reporting to SORMAS.');
      await sormasserviceClient.setStatus(data.uuid, 'REGISTERED');
    }).catch((e) => {
      console.log(e);
      throw Boom.boomify(e);
    });

    try {
      // Store mail in personalData
      await personaldataserviceClient.updatePersonalData(generatedPseudonym, {
        email: data.email,
      });
      const mailContent =
        mailTemplateService.createSormasRegistrationMail(generatedPassword);
      await MailService.sendMail(data.email, mailContent);

      // The pseudonym is displayed to the PM without the password
      return {
        pseudonym: generatedPseudonym,
        password: null,
      };
    } catch (error) {
      console.warn(error);
      // If the mail could not be sent we display both, the pseudonym and the password to the PM
      return {
        pseudonym: generatedPseudonym,
        password: generatedPassword,
      };
    }
  }
  /* eslint-enable */

  /**
   * updates the user's age and gender in DB
   * @param decodedToken the decoded jwt of the request
   * @param username the name of the user that should be updated
   * @param userValues the values age and gender to change
   */
  public static async updateUser(
    decodedToken: AccessToken,
    username: string,
    userValues: { is_test_proband?: boolean; account_status?: AccountStatus }
  ): Promise<
    | { test_proband_state: boolean }
    | { username: string; account_status: AccountStatus }
  > {
    const userRole = decodedToken.role;
    const requester = decodedToken.username;

    switch (userRole) {
      case 'Untersuchungsteam':
        if (userValues.is_test_proband === undefined) {
          throw Boom.badData('payload incorrect');
        }
        await postgresqlHelper.changeTestProbandState(
          username,
          userValues.is_test_proband,
          requester
        );
        return { test_proband_state: userValues.is_test_proband };

      case 'ProbandenManager':
        if (userValues.account_status === undefined) {
          throw Boom.badData('payload incorrect');
        }
        return await runTransaction(async (transaction) => {
          const updatedProbandStatus =
            (await postgresqlHelper.updateProbandStatus(
              username,
              userValues.account_status,
              requester,
              transaction
            )) as { username: string; account_status: AccountStatus };
          if (updatedProbandStatus.account_status === 'deactivated') {
            await personaldataserviceClient.deletePersonalDataOfUser(
              updatedProbandStatus.username
            );
          }
          return updatedProbandStatus;
        });
      default:
        throw Boom.forbidden('Wrong role for this command');
    }
  }

  /**
   * deletes a user and all its data from DB if user is allowed to
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
