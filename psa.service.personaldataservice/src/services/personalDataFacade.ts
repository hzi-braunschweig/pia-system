/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StudyName, Pseudonym } from '@pia/lib-publicapi';
import {
  PersonalDataPatchRequestDto,
  PersonalDataPatchResponseDto,
  mapPersonalDataDtoToPersonalDataModel,
  mapPersonalDataModelToPersonalDataDto,
} from '../controllers/dtos/personalDataRequestDto';
import { PersonalDataService } from './personalDataService';
import { userserviceClient } from '../clients/userserviceClient';
import { ParticipantNotFoundError, StudyNotFoundError } from '../errors';

export class PersonalDataFacade {
  public static async patchPersonalData(
    studyName: StudyName,
    pseudonym: Pseudonym,
    personalDataDto: PersonalDataPatchRequestDto
  ): Promise<PersonalDataPatchResponseDto> {
    const study = await userserviceClient.getStudy(studyName);

    if (!study) {
      throw new StudyNotFoundError(studyName);
    }

    const proband = await userserviceClient.getProband(pseudonym);

    if (!proband || proband.study != studyName) {
      throw new ParticipantNotFoundError(pseudonym);
    }

    const result = await PersonalDataService.createOrUpdate(
      {
        pseudonym: pseudonym,
        complianceContact: proband.complianceContact,
        study: studyName,
      },
      mapPersonalDataDtoToPersonalDataModel(
        studyName,
        pseudonym,
        personalDataDto
      )
    );

    return mapPersonalDataModelToPersonalDataDto(result);
  }
}
