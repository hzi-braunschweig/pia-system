/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BloodSamplesInteractor } from '../interactors/bloodSamplesInteractor';
import { Request } from '@hapi/hapi';
import { AccessToken } from '@pia/lib-service-core';
import { BloodSample } from '../models/bloodSample';
import { handleError } from '../handleError';

export class BloodSamplesHandler {
  public static async getAllSamples(
    this: void,
    request: Request
  ): Promise<unknown> {
    return BloodSamplesInteractor.getAllBloodSamples(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string
    ).catch(handleError);
  }

  public static async getOneSample(
    this: void,
    request: Request
  ): Promise<unknown> {
    return BloodSamplesInteractor.getOneBloodSample(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string,
      request.params['sampleId'] as string
    ).catch(handleError);
  }

  /**
   * Returns single or more blood samples
   */
  public static async getSampleWithSampleID(
    this: void,
    request: Request
  ): Promise<unknown> {
    return BloodSamplesInteractor.getBloodSampleWithSampleID(
      request.auth.credentials as AccessToken,
      request.params['sampleId'] as string
    ).catch(handleError);
  }

  public static async createOneSample(
    this: void,
    request: Request
  ): Promise<unknown> {
    return BloodSamplesInteractor.createOneBloodSample(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string,
      request.payload as BloodSample
    ).catch(handleError);
  }

  public static async updateOneSample(
    this: void,
    request: Request
  ): Promise<unknown> {
    return BloodSamplesInteractor.updateOneBloodSample(
      request.auth.credentials as AccessToken,
      request.params['pseudonym'] as string,
      request.params['sampleId'] as string,
      request.payload as BloodSample
    ).catch(handleError);
  }
}
