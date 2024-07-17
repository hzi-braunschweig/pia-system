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
  ProbandSelfDeletionType,
  ProbandService,
} from '../services/probandService';
import {
  AccountCreateError,
  IdsAlreadyExistsError,
  PlannedProbandNotFoundError,
  ParticipantNotFoundError,
  ProbandSaveError,
  PseudonymAlreadyExistsError,
  StudyNotFoundError,
} from '../errors';
import { AccessToken } from '@pia/lib-service-core';

export class ProbandsInteractor {
  public static async getAllProbandsOfStudy(
    studyName: string
  ): Promise<ProbandDto[]> {
    return await ProbandService.getAllProbandsOfStudy(studyName);
  }

  public static async getExport(studyName: string): Promise<string> {
    return await ProbandService.getExport(studyName);
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
      } else if (e instanceof ParticipantNotFoundError) {
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
    selfDeletionType: ProbandSelfDeletionType
  ): Promise<null> {
    if (pseudonym !== decodedToken.username) {
      throw Boom.forbidden('probands can only delete their own accounts');
    }
    if (selfDeletionType === 'full') {
      // A participant deleting themselves fully, means deleting everything except the pseudonym.
      // ProbandService.delete() accepts the ProbandDeletionType, which needs to be 'default' to
      // keep the pseudonym and delete everything else.
      await ProbandService.delete(pseudonym, 'default');
    } else {
      await ProbandService.revokeComplianceContact(pseudonym);
    }
    return null;
  }
}
