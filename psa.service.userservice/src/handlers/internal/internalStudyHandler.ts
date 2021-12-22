/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Request } from '@hapi/hapi';
import { Study } from '../../models/study';
import { InternalStudyInteractor } from '../../interactors/internal/internalStudyInteractor';

/**
 * @description Internal handler for users
 */
export class InternalStudyHandler {
  public static async getStudy(this: void, request: Request): Promise<Study> {
    return await InternalStudyInteractor.getStudy(
      request.params['studyName'] as string
    );
  }
}
