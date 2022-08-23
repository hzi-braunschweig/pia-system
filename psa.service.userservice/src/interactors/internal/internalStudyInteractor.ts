/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { StudyRepository } from '../../repositories/studyRepository';
import { EntityNotFoundError } from '../../errors';
import { DbStudy } from '../../models/study';

/**
 * @description internal interactor that handles user requests
 */
export class InternalStudyInteractor {
  /**
   * Gets the user's primary study from the DB
   */
  public static async getStudy(studyName: string): Promise<DbStudy> {
    try {
      return await StudyRepository.getStudy(studyName);
    } catch (err) {
      if (err instanceof EntityNotFoundError) throw Boom.notFound();
      else throw Boom.boomify(err as Error);
    }
  }
}
