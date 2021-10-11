/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  CreateProbandError,
  CreateProbandExternalResponse,
  CreateProbandRequest,
  Proband,
} from '../models/proband';
import { ProbandsRepository } from '../repositories/probandsRepository';
import { AccessToken } from '@pia/lib-service-core';
import Boom from '@hapi/boom';
import { ProbandService } from '../services/probandService';
import { ProfessionalRole } from '../models/role';
import {
  AccountCreateError,
  NoAccessToStudyError,
  NoPlannedProbandFoundError,
  ProbandAlreadyExistsError,
  ProbandSaveError,
  WrongRoleError,
} from '../errors';
import postgresHelper from '../services/postgresqlHelper';
import { config } from '../config';
import { StatusCodes } from 'http-status-codes';

export class ProbandsInteractor {
  public static async getAllProbandsOfStudy(
    studyName: string,
    decodedToken: AccessToken
  ): Promise<Proband[]> {
    if (decodedToken.role !== 'ProbandenManager') {
      throw Boom.forbidden('User has wrong role');
    }
    if (!decodedToken.groups.includes(studyName)) {
      throw Boom.forbidden('User is not in the requested study');
    }
    return ProbandsRepository.find({ studyName: studyName });
  }

  public static async createIDSProband(
    studyName: string,
    ids: string,
    decodedToken: AccessToken
  ): Promise<void> {
    try {
      await ProbandService.createIDSProband(studyName, ids, {
        username: decodedToken.username,
        role: decodedToken.role as ProfessionalRole,
        studies: decodedToken.groups,
      });
    } catch (e) {
      if (e instanceof WrongRoleError) {
        throw Boom.forbidden('wrong role');
      } else if (e instanceof NoAccessToStudyError) {
        throw Boom.forbidden('no access to study');
      } else if (e instanceof ProbandAlreadyExistsError) {
        throw Boom.preconditionRequired('proband already exists');
      } else if (e instanceof AccountCreateError) {
        throw Boom.internal('a problem occurred while creating the account');
      } else if (e instanceof ProbandSaveError) {
        throw Boom.internal('a problem occurred while saving the proband');
      } else {
        console.error(e);
        throw Boom.badImplementation('an unknown error occurred');
      }
    }
  }

  public static async createProband(
    studyName: string,
    newProbandData: CreateProbandRequest,
    decodedToken: AccessToken
  ): Promise<void> {
    try {
      await ProbandService.createProband(studyName, newProbandData, {
        username: decodedToken.username,
        role: decodedToken.role as ProfessionalRole,
        studies: decodedToken.groups,
      });
    } catch (e) {
      if (e instanceof WrongRoleError) {
        throw Boom.forbidden('wrong role');
      } else if (e instanceof NoAccessToStudyError) {
        throw Boom.forbidden('no access to study');
      } else if (e instanceof NoPlannedProbandFoundError) {
        throw Boom.preconditionRequired('no planned proband found');
      } else if (e instanceof ProbandAlreadyExistsError) {
        throw Boom.preconditionRequired('proband already exists');
      } else if (e instanceof AccountCreateError) {
        throw Boom.internal('a problem occurred while creating the account');
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
    const response: CreateProbandExternalResponse = {
      pseudonym: newProbandData.pseudonym,
      resultURL: new URL(
        '/probands/' + newProbandData.pseudonym,
        config.webappUrl
      ),
    };

    const requester = (await postgresHelper.getUser(utMail)) as null | {
      username: string;
      role: ProfessionalRole;
      study_accesses?: { study_id: string }[];
    };
    if (!requester) {
      throw this.createCreateProbandFromExternalError(
        response,
        CreateProbandError.USER_NOT_FOUND,
        StatusCodes.FORBIDDEN,
        new Error('the user from ut_mail does not exist')
      );
    }

    try {
      await ProbandService.createProband(studyName, newProbandData, {
        username: requester.username,
        role: requester.role,
        studies: requester.study_accesses?.map((sa) => sa.study_id) ?? [],
      });
      response.resultURL.searchParams.set('created', 'true');
      return response;
    } catch (e) {
      let errorType: CreateProbandError;
      let statusCode: StatusCodes;
      if (e instanceof WrongRoleError) {
        errorType = CreateProbandError.WRONG_ROLE;
        statusCode = StatusCodes.FORBIDDEN;
      } else if (e instanceof NoAccessToStudyError) {
        errorType = CreateProbandError.NO_ACCESS_TO_STUDY;
        statusCode = StatusCodes.FORBIDDEN;
      } else if (e instanceof NoPlannedProbandFoundError) {
        errorType = CreateProbandError.NO_PLANNED_PROBAND_FOUND;
        statusCode = StatusCodes.PRECONDITION_REQUIRED;
      } else if (e instanceof ProbandAlreadyExistsError) {
        errorType = CreateProbandError.PROBAND_ALREADY_EXISTS;
        statusCode = StatusCodes.PRECONDITION_REQUIRED;
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
        e
      );
    }
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
}
