/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SystemComplianceType } from '@pia-system/lib-http-clients-internal';
import { getCustomRepository } from 'typeorm';
import { complianceserviceClient } from '../clients/complianceserviceClient';
import { SampleDto } from '../controllers/internal/dtos/sampleDto';
import { LabResult } from '../entities/labResult';
import { ParticipantComplianceIsMissing } from '../errors';
import { Pseudonym, SampleId } from '../models/customTypes';
import { CustomLabResultRepository } from '../repositories/customLabResultRepository';

export class SampleService {
  public static async patchSample(
    studyName: string,
    pseudonym: Pseudonym,
    sampleId: SampleId,
    sample: SampleDto
  ): Promise<LabResult> {
    const hasSamplesCompliance =
      await complianceserviceClient.hasAgreedToCompliance(
        pseudonym,
        studyName,
        SystemComplianceType.SAMPLES
      );

    if (!hasSamplesCompliance) {
      throw new ParticipantComplianceIsMissing(
        'Participant has not agreed to save samples'
      );
    }

    const repository = getCustomRepository(CustomLabResultRepository);
    const labResult = await repository.findOneForParticipant(
      sampleId,
      pseudonym,
      sample.dummyId
    );

    labResult.dateOfSampling = sample.dateOfSampling;

    return await repository.save(labResult);
  }
}
