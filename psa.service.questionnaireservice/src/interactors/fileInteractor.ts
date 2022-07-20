/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';

import {
  AccessToken,
  assertStudyAccess,
  getPrimaryRealmRole,
} from '@pia/lib-service-core';
import { QuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';
import pgHelper from '../services/postgresqlHelper';
import { UserFile } from '../models/userFile';

/**
 * @description interactor that handles answers requests based on users permissions
 */
export class FileInteractor {
  public static async getFileById(
    id: string,
    decodedToken: AccessToken
  ): Promise<UserFile> {
    let file: UserFile | null;
    try {
      file = (await pgHelper.getFileBy(id)) as UserFile | null;
    } catch (err) {
      console.log(err);
      throw Boom.badImplementation('Could not get image');
    }

    if (!file) {
      throw Boom.notFound('File was not found');
    }

    switch (getPrimaryRealmRole(decodedToken)) {
      case 'Proband': {
        if (file.user_id !== decodedToken.username) {
          throw Boom.forbidden('Wrong user for this command');
        }
        return file;
      }
      case 'Untersuchungsteam': {
        const qInstance =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForInvestigator(
            file.questionnaire_instance_id
          ).catch((err) => {
            console.log(err);
            throw Boom.notFound('Questionnaire instance not found');
          });
        assertStudyAccess(qInstance.study_id, decodedToken);
        return file;
      }
      case 'Forscher': {
        const qInstance =
          await QuestionnaireInstanceRepository.getQuestionnaireInstanceForResearcher(
            file.questionnaire_instance_id
          ).catch((err) => {
            console.log(err);
            throw Boom.notFound('Questionnaire instance not found');
          });
        if (
          !(
            qInstance.status === 'released_once' ||
            qInstance.status === 'released_twice' ||
            qInstance.status === 'released'
          )
        ) {
          throw Boom.notFound('File has not been released yet');
        }
        assertStudyAccess(qInstance.study_id, decodedToken);
        return file;
      }
      default:
        throw Boom.forbidden('Wrong role for this command');
    }
  }
}
