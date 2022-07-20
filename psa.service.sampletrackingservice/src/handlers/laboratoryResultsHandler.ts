/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LaboratoryResultsInteractor } from '../interactors/laboratoryResultsInteractor';
import * as laboratoryResultTemplateService from '../services/laboratoryResultTemplateService';
import { TemplatePipelineService } from '../services/templatePipelineService';

import { Request } from '@hapi/hapi';
import { AccessToken } from '@pia/lib-service-core';
import { LabResult } from '../models/LabResult';
import { handleError } from '../handleError';

export class LaboratoryResultsHandler {
  public static async getAllResults(
    this: void,
    request: Request
  ): Promise<unknown> {
    return LaboratoryResultsInteractor.getAllLaboratoryResults(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string
    ).catch(handleError);
  }

  public static async getOneResult(
    this: void,
    request: Request
  ): Promise<unknown> {
    const labResult = await LaboratoryResultsInteractor.getOneLaboratoryResult(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string,
      request.params['resultId'] as string
    ).catch(handleError);

    if (request.headers['accept'] === 'text/html') {
      return TemplatePipelineService.generateLaboratoryResult(
        labResult,
        laboratoryResultTemplateService.getTemplate()
      );
    } else {
      return labResult;
    }
  }

  public static async getOneResultWitSampleID(
    this: void,
    request: Request
  ): Promise<unknown> {
    return LaboratoryResultsInteractor.getLaboratoryResultWithSampleID(
      request.auth.credentials as AccessToken,
      request.params['sampleId'] as string
    ).catch(handleError);
  }

  /**
   * triggers labresults import from ftp server
   */
  public static async postLabResultsImport(this: void): Promise<unknown> {
    return LaboratoryResultsInteractor.postLabResultsImport().catch(
      handleError
    );
  }

  public static async createOneResult(
    this: void,
    request: Request
  ): Promise<unknown> {
    return LaboratoryResultsInteractor.createOneLaboratoryResult(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string,
      request.payload as LabResult
    ).catch(handleError);
  }

  public static async updateOneResult(
    this: void,
    request: Request
  ): Promise<unknown> {
    return LaboratoryResultsInteractor.updateOneLaboratoryResult(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string,
      request.params['resultId'] as string,
      request.payload as LabResult
    ).catch(handleError);
  }
}
