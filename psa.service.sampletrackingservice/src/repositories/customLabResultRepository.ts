/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { EntityRepository, getRepository, Repository } from 'typeorm';
import { LabResult, StudyStatus } from '../entities/labResult';
import {
  LabResultDeleted,
  LabResultDummyIdDoesNotMatch,
  LabResultNotFound,
} from '../errors';
import { Pseudonym, SampleId } from '../models/customTypes';

@EntityRepository(LabResult)
export class CustomLabResultRepository extends Repository<LabResult> {
  public async findOneForParticipant(
    id: SampleId,
    pseudonym: Pseudonym,
    dummyId?: SampleId
  ): Promise<LabResult> {
    const repository = getRepository(LabResult);
    const labResult = await repository.findOne({
      where: { id, pseudonym },
    });

    if (!labResult) {
      throw new LabResultNotFound('Lab result does not exist');
    }

    if (!this.doesLabResultExist(labResult)) {
      throw new LabResultDeleted('Lab result is deleted');
    }

    if (dummyId && !this.isDummyIdValid(labResult, dummyId)) {
      throw new LabResultDummyIdDoesNotMatch(
        'Lab result dummy ID does not match'
      );
    }

    return labResult;
  }

  private doesLabResultExist(labResult: LabResult): labResult is LabResult {
    return (
      labResult.studyStatus !== StudyStatus.Deleted &&
      labResult.studyStatus !== StudyStatus.Deactivated
    );
  }

  private isDummyIdValid(labResult: LabResult, dummyId: SampleId): boolean {
    return labResult.dummyId === dummyId;
  }
}
