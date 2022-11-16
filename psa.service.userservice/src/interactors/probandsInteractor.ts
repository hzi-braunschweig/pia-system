/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  CreateProbandRequest,
  CreateProbandResponse,
  ProbandDto,
} from '../models/proband';
import Boom from '@hapi/boom';
import {
  ProbandAccountDeletionType,
  ProbandService,
} from '../services/probandService';
import {
  AccountCreateError,
  IdsAlreadyExistsError,
  PlannedProbandNotFoundError,
  ProbandNotFoundError,
  ProbandSaveError,
  PseudonymAlreadyExistsError,
  StudyNotFoundError,
} from '../errors';
import { getRepository } from 'typeorm';
import { Proband } from '../entities/proband';
import { AccountStatus } from '../models/accountStatus';
import { ProbandAccountService } from '../services/probandAccountService';
import { AccessToken } from '@pia/lib-service-core';

export class ProbandsInteractor {
  public static async getAllProbandsOfStudy(
    studyName: string
  ): Promise<ProbandDto[]> {
    const probandAccountsList =
      await ProbandAccountService.getProbandAccountsByStudyName(studyName);
    const probandAccountsSet = new Set(
      probandAccountsList.map((account) => account.username)
    );

    return (
      await getRepository(Proband).find({ study: { name: studyName } })
    ).map((proband) => ({
      ...proband,
      study: studyName,
      accountStatus: probandAccountsSet.has(proband.pseudonym)
        ? AccountStatus.ACCOUNT
        : AccountStatus.NO_ACCOUNT,
    }));
  }

  public static async createProband(
    studyName: string,
    probandRequest: CreateProbandRequest
  ): Promise<CreateProbandResponse> {
    try {
      return await ProbandService.createProbandWithAccount(
        studyName,
        probandRequest,
        true,
        probandRequest.temporaryPassword ?? true
      );
    } catch (e) {
      if (e instanceof StudyNotFoundError) {
        throw Boom.preconditionRequired('study not found');
      } else if (e instanceof PlannedProbandNotFoundError) {
        throw Boom.preconditionRequired('planned proband not found');
      } else if (e instanceof PseudonymAlreadyExistsError) {
        throw Boom.conflict('proband with same pseudonym already exists');
      } else if (e instanceof ProbandNotFoundError) {
        throw Boom.conflict('proband with the given ids not found');
      } else if (e instanceof AccountCreateError) {
        console.error(e);
        throw Boom.badImplementation(
          'a problem occurred while creating the account'
        );
      } else if (e instanceof ProbandSaveError) {
        console.error(e);
        throw Boom.badImplementation(
          'a problem occurred while saving the proband'
        );
      } else {
        console.error(e);
        throw Boom.badImplementation('an unknown error occurred');
      }
    }
  }

  public static async createIDSProband(
    studyName: string,
    ids: string
  ): Promise<void> {
    try {
      await ProbandService.createIDSProbandWithoutAccount(studyName, ids);
    } catch (e) {
      if (e instanceof StudyNotFoundError) {
        throw Boom.preconditionRequired('study not found');
      } else if (e instanceof PseudonymAlreadyExistsError) {
        throw Boom.conflict('proband with same pseudonym already exists');
      } else if (e instanceof IdsAlreadyExistsError) {
        throw Boom.conflict('proband with same ids already exists');
      } else if (e instanceof ProbandSaveError) {
        throw Boom.internal('a problem occurred while saving the proband');
      } else {
        console.error(e);
        throw Boom.badImplementation('an unknown error occurred');
      }
    }
  }

  public static async deleteAccount(
    decodedToken: AccessToken,
    pseudonym: string,
    deletionType: ProbandAccountDeletionType
  ): Promise<null> {
    if (pseudonym !== decodedToken.username) {
      throw Boom.forbidden('probands can only delete their own accounts');
    }
    if (deletionType === 'full') {
      await ProbandService.delete(pseudonym);
    } else {
      await ProbandService.revokeComplianceContact(pseudonym);
    }
    return null;
  }
}
