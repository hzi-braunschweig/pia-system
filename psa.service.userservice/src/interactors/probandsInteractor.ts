/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  CreateProbandError,
  CreateProbandExternalResponse,
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
  NoAccessToStudyError,
  PlannedProbandNotFoundError,
  ProbandNotFoundError,
  ProbandSaveError,
  PseudonymAlreadyExistsError,
  StudyNotFoundError,
  WrongRoleError,
} from '../errors';
import { config } from '../config';
import { StatusCodes } from 'http-status-codes';
import { ProfessionalAccountService } from '../services/professionalAccountService';
import { ProfessionalAccount } from '../models/account';
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
    let password: string;
    try {
      password = await ProbandService.createProbandWithAccount(
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
    return {
      pseudonym: probandRequest.pseudonym,
      password: password,
    };
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

  public static async createProbandFromExternal(
    studyName: string,
    newProbandData: CreateProbandRequest,
    utMail: string
  ): Promise<CreateProbandExternalResponse> {
    /**
     * Save the pseudonym from the external system as is (in mixed case)
     */
    const externalPseudonym = newProbandData.pseudonym;
    /**
     * Convert the pseudonym from the external system to PIAs lower case convention
     */
    newProbandData.pseudonym = newProbandData.pseudonym.toLowerCase();

    const response: CreateProbandExternalResponse = {
      pseudonym: newProbandData.pseudonym,
      resultURL: new URL(
        '/probands/' + newProbandData.pseudonym,
        config.webappUrl
      ),
    };

    let requester: ProfessionalAccount | undefined;
    try {
      requester = await ProfessionalAccountService.getProfessionalAccount(
        utMail
      );
    } catch (err) {
      throw this.createCreateProbandFromExternalError(
        response,
        CreateProbandError.USER_NOT_FOUND,
        StatusCodes.FORBIDDEN,
        new Error('the user from ut_mail does not exist as a user')
      );
    }

    try {
      this.checkAccessOfInvestigatorToStudy(requester, studyName);

      await ProbandService.createProbandWithAccount(
        studyName,
        newProbandData,
        true,
        true
      );
      await ProbandService.updateExternalId(
        newProbandData.pseudonym,
        externalPseudonym
      );
      response.resultURL.searchParams.set('created', 'true');
      return response;
    } catch (e) {
      let errorType: CreateProbandError;
      let statusCode: StatusCodes;
      if (e instanceof NoAccessToStudyError) {
        errorType = CreateProbandError.NO_ACCESS_TO_STUDY;
        statusCode = StatusCodes.FORBIDDEN;
      } else if (e instanceof PlannedProbandNotFoundError) {
        errorType = CreateProbandError.NO_PLANNED_PROBAND_FOUND;
        statusCode = StatusCodes.PRECONDITION_REQUIRED;
      } else if (e instanceof PseudonymAlreadyExistsError) {
        errorType = CreateProbandError.PROBAND_ALREADY_EXISTS;
        statusCode = StatusCodes.CONFLICT;
      } else if (e instanceof AccountCreateError) {
        errorType = CreateProbandError.CREATING_ACCOUNG_FAILED;
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      } else if (e instanceof ProbandSaveError) {
        errorType = CreateProbandError.SAVING_PROBAND_FAILED;
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      } else {
        errorType = CreateProbandError.UNKNOWN_ERROR;
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      }

      throw this.createCreateProbandFromExternalError(
        response,
        errorType,
        statusCode,
        e as Error
      );
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

  private static createCreateProbandFromExternalError(
    response: CreateProbandExternalResponse,
    errorType: CreateProbandError,
    statusCode: StatusCodes,
    e: Error
  ): Boom.Boom {
    console.warn('Creating a proband from external system failed:', e);
    response.resultURL.searchParams.set('created', 'false');
    response.resultURL.searchParams.set('error', errorType);
    const boom = Boom.boomify(e, { statusCode });
    Object.assign(boom.output.payload, response);
    return boom;
  }

  private static checkAccessOfInvestigatorToStudy(
    requester: ProfessionalAccount,
    studyName: string
  ): void {
    if (requester.role !== 'Untersuchungsteam') {
      throw new WrongRoleError('The user is not an investigator');
    }
    if (!requester.studies.includes(studyName)) {
      throw new NoAccessToStudyError(
        'The user has no permission to create the proband in that study'
      );
    }
  }
}
