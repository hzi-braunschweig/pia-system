/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { AuthserviceClient } from '../clients/authserviceClient';
import {
  AccountCreateError,
  NoAccessToStudyError,
  NoPlannedProbandFoundError,
  ProbandAlreadyExistsError,
  ProbandSaveError,
  WrongRoleError,
} from '../errors';
import { ProfessionalUser } from '../models/professionalUser';
import { CreateProbandRequest } from '../models/proband';
import { StatusCodes } from 'http-status-codes';
import { PlannedProbandsRepository } from '../repositories/plannedProbandsRepository';
import { runTransaction } from '../db';
import { ProbandsRepository } from '../repositories/probandsRepository';
import { SecureRandomPasswordService } from './secureRandomPasswordService';
import { User } from '../models/user';

export class ProbandService {
  public static async createIDSProband(
    studyName: string,
    ids: string,
    requester: ProfessionalUser
  ): Promise<void> {
    if (requester.role !== 'Untersuchungsteam') {
      throw new WrongRoleError('The user is not an investigator');
    }
    if (!requester.studies.includes(studyName)) {
      throw new NoAccessToStudyError(
        'The user has no permission to create the proband in that study'
      );
    }

    const user: User = {
      username: ids,
      role: 'Proband',
      pw_change_needed: true,
      account_status: 'no_account',
    };

    try {
      // when the database is splitted we don't want to create a user
      // for ids probands anymore. Just create them when the get activated.
      await AuthserviceClient.createUser(user);
    } catch (error) {
      if (
        error instanceof Boom.Boom &&
        error.output.statusCode === StatusCodes.CONFLICT
      ) {
        throw new ProbandAlreadyExistsError(
          'The proband does already exist',
          error
        );
      }
      throw new AccountCreateError('Could not activate the account', error);
    }

    try {
      await ProbandsRepository.saveIDSProband(ids, studyName);
    } catch (e) {
      throw new ProbandSaveError('could not create the proband', e);
    }
  }

  public static async createProband(
    studyName: string,
    newProbandData: CreateProbandRequest,
    requester: ProfessionalUser
  ): Promise<void> {
    if (requester.role !== 'Untersuchungsteam') {
      throw new WrongRoleError('The user is not an investigator');
    }
    if (!requester.studies.includes(studyName)) {
      throw new NoAccessToStudyError(
        'The user has no permission to create the proband in that study'
      );
    }
    await runTransaction(async (t) => {
      let plannedProband;
      try {
        plannedProband = await PlannedProbandsRepository.find(
          { pseudonym: newProbandData.pseudonym, study: studyName },
          { transaction: t }
        );
        plannedProband.activatedAt = new Date();
        await PlannedProbandsRepository.save(plannedProband, {
          transaction: t,
        });
      } catch (e) {
        throw new NoPlannedProbandFoundError(
          'Could not find a related planned proband',
          e
        );
      }

      // Add pseudonym and account to an existing proband with ids
      if (newProbandData.ids) {
        const user: User & { new_username?: string } = {
          username: newProbandData.ids,
          new_username: newProbandData.pseudonym,
          password: plannedProband.password,
          role: 'Proband',
          pw_change_needed: true,
          initial_password_validity_date:
            SecureRandomPasswordService.generateInitialPasswordValidityDate(),
          account_status: 'active',
        };

        // when the db is splitted (into user and proband).
        // we will only create the user when the account gets activated.
        try {
          await AuthserviceClient.updateUser(user);
        } catch (error) {
          throw new AccountCreateError('Could not activate the account', error);
        }
      } else {
        // Create new proband with pseudonym and account
        const user: User = {
          username: newProbandData.pseudonym,
          password: plannedProband.password,
          role: 'Proband',
          pw_change_needed: true,
          initial_password_validity_date:
            SecureRandomPasswordService.generateInitialPasswordValidityDate(),
          account_status: 'active',
        };

        try {
          await AuthserviceClient.createUser(user);
        } catch (error) {
          if (
            error instanceof Boom.Boom &&
            error.output.statusCode === StatusCodes.CONFLICT
          ) {
            throw new ProbandAlreadyExistsError(
              'The proband does already exist',
              error
            );
          }
          throw new AccountCreateError('Could not activate the account', error);
        }
      }

      try {
        await ProbandsRepository.save(
          { ...newProbandData, study: studyName },
          {
            transaction: t,
          }
        );
      } catch (e) {
        throw new ProbandSaveError('could not create the proband', e);
      }
    });
  }
}
