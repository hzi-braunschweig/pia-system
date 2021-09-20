/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Proband } from '../models/proband';
import { ProbandsRepository } from '../repositories/probandsRepository';
import { AccessToken } from '@pia/lib-service-core';
import Boom from '@hapi/boom';

export class ProbandsInteractor {
  public static async getAllProbandsOfStudy(
    studyName: string,
    decodedToken: AccessToken
  ): Promise<Proband[]> {
    if (decodedToken.role !== 'ProbandenManager') {
      throw Boom.forbidden('User has wrong role');
    }
    if (!decodedToken.groups.includes(studyName)) {
      throw Boom.forbidden('User is not in the requested study');
    }
    return await ProbandsRepository.find({ studyName: studyName });
  }
}
