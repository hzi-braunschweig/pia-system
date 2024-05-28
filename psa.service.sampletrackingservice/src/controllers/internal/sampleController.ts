/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Boom } from '@hapi/boom';
import { StatusCodes } from 'http-status-codes';
import { Body, Controller, Patch, Path, Route, Tags } from 'tsoa';
import { LabResult } from '../../entities/labResult';
import {
  LabResultDeleted,
  LabResultDummyIdDoesNotMatch,
  LabResultNotFound,
  ParticipantComplianceIsMissing,
} from '../../errors';
import { Pseudonym, SampleId } from '../../models/customTypes';
import { SampleService } from '../../services/sampleService';
import { SampleDto } from './dtos/sampleDto';

@Route('study/{studyName}/participants/{pseudonym}/samples')
@Tags('Samples')
export class SampleController extends Controller {
  @Patch('{sampleId}')
  public async patchSample(
    @Path() studyName: string,
    @Path() pseudonym: Pseudonym,
    @Path() sampleId: SampleId,
    @Body() sample: SampleDto
  ): Promise<LabResult> {
    try {
      return await SampleService.patchSample(
        studyName,
        pseudonym,
        sampleId,
        sample
      );
    } catch (e: unknown) {
      if (e instanceof LabResultNotFound) {
        throw this.createBoom(e, StatusCodes.NOT_FOUND);
      } else if (e instanceof LabResultDeleted) {
        throw this.createBoom(e, StatusCodes.NOT_FOUND);
      } else if (e instanceof LabResultDummyIdDoesNotMatch) {
        throw this.createBoom(e, StatusCodes.UNPROCESSABLE_ENTITY);
      } else if (e instanceof ParticipantComplianceIsMissing) {
        throw this.createBoom(e, StatusCodes.FORBIDDEN);
      }

      this.internalServerError(e);
    }
  }

  private createBoom(exception: Error, statusCode: StatusCodes): Boom<unknown> {
    return new Boom(exception.message, { statusCode });
  }

  private internalServerError(e: unknown): never {
    console.error('ERROR', e);
    throw this.createBoom(
      new Error('An unknown error occurred'),
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}
