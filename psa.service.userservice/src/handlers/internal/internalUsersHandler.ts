/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { Request } from '@hapi/hapi';

import { InternalProbandsInteractor } from '../../interactors/internal/internalProbandsInteractor';
import {
  CreateProbandRequest,
  CreateProbandResponse,
  ProbandDto,
  ProbandExternalIdResponse,
} from '../../models/proband';
import { ExternalCompliance } from '../../models/externalCompliance';
import { Proband } from '../../entities/proband';
import { ProbandStatus } from '../../models/probandStatus';

/**
 * @description Internal handler for users
 */
export class InternalUsersHandler {
  public static async postProband(
    this: void,
    request: Request
  ): Promise<CreateProbandResponse> {
    const studyName = request.params['studyName'] as string;
    const probandRequest = request.payload as CreateProbandRequest;
    return await InternalProbandsInteractor.createProband(
      studyName,
      probandRequest
    );
  }

  public static async deleteProbandData(
    this: void,
    request: Request
  ): Promise<null> {
    return InternalProbandsInteractor.deleteProbandData(
      request.params['username'] as string,
      request.query['keepUsageData'] as boolean,
      request.query['full'] as boolean
    ).catch((err: Error) => {
      request.log(
        ['error'],
        'Could not delete user from DB: ' + err.toString().toString()
      );
      throw Boom.notFound(err.toString());
    });
  }

  public static async getProband(
    this: void,
    request: Request
  ): Promise<ProbandDto> {
    return await InternalProbandsInteractor.getProband(
      request.params['pseudonym'] as string
    );
  }

  public static async getProbandByIDS(
    this: void,
    request: Request
  ): Promise<ProbandDto> {
    return InternalProbandsInteractor.getProbandByIDS(
      request.params['ids'] as string
    );
  }

  public static async lookupIds(
    this: void,
    request: Request
  ): Promise<string | null> {
    return InternalProbandsInteractor.lookupIds(
      request.params['username'] as string
    ).catch((err: Error) => {
      request.log(
        ['error'],
        'Could not find user in DB: ' + err.toString().toString()
      );
      throw Boom.notFound(err.toString());
    });
  }

  public static async lookupMappingId(
    this: void,
    request: Request
  ): Promise<string> {
    return InternalProbandsInteractor.lookupMappingId(
      request.params['username'] as string
    ).catch((err: Error) => {
      request.log(
        ['error'],
        'Could not find user in DB lookupMappingId: ' + err.toString()
      );
      throw Boom.notFound(err.toString());
    });
  }

  public static async getUserExternalCompliance(
    this: void,
    request: Request
  ): Promise<ExternalCompliance> {
    let externalCompliance: ExternalCompliance | null;
    try {
      externalCompliance =
        await InternalProbandsInteractor.getProbandExternalCompliance(
          request.params['username'] as string
        );
    } catch (err) {
      request.log(
        ['error'],
        'Could not get an answer from database for external compliance'
      );
      request.log(['error'], err as Error);
      throw Boom.serverUnavailable(undefined, err as Error);
    }
    if (externalCompliance !== null) {
      return externalCompliance;
    } else {
      throw Boom.notFound('no user found');
    }
  }

  public static async getProbandsWithAccessToFromProfessional(
    this: void,
    request: Request
  ): Promise<string[]> {
    return await InternalProbandsInteractor.getProbandsWithAccessToFromProfessional(
      request.params['username'] as string
    );
  }

  public static async patchProband(
    this: void,
    request: Request
  ): Promise<null> {
    await InternalProbandsInteractor.patchProband(
      request.params['pseudonym'] as string,
      request.payload as
        | Pick<Proband, 'complianceContact'>
        | Pick<Proband, 'status'>
    );
    return null;
  }

  public static async getPseudonyms(
    this: void,
    request: Request
  ): Promise<string[]> {
    return InternalProbandsInteractor.getPseudonyms(
      request.query['study'] as string,
      request.query['status'] as ProbandStatus,
      request.query['complianceContact'] as boolean
    ).catch((err: Error) => {
      console.warn('getPseudonyms', err);
      return Boom.boomify(err);
    });
  }

  public static async getExternalIds(
    this: void,
    request: Request
  ): Promise<ProbandExternalIdResponse[]> {
    return InternalProbandsInteractor.getExternalIds(
      request.query['study'] as string,
      request.query['complianceContact'] as boolean
    ).catch((err: Error) => {
      console.warn('getExternalIds', err);
      return Boom.boomify(err);
    });
  }
}
