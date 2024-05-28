/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServiceClient } from '../core/serviceClient';
import { LabResultInternalDto } from '../dtos/labResult';
import { PatchSampleInternalDto } from '../dtos/sample';

export class SampletrackingserviceClient extends ServiceClient {
  public async patchSample(
    studyName: string,
    pseudonym: string,
    sampleId: string,
    sample: PatchSampleInternalDto
  ): Promise<LabResultInternalDto> {
    return await this.httpClient.patch<LabResultInternalDto>(
      `/study/${studyName}/participants/${pseudonym}/samples/${sampleId}`,
      sample,
      {
        returnNullWhenNotFound: false,
      }
    );
  }
}
