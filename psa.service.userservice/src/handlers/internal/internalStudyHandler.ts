/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { InternalStudyInteractor } from '../../interactors/internal/internalStudyInteractor';

/**
 * @description Internal handler for users
 */
export class InternalStudyHandler {
  public static getStudy: Lifecycle.Method = async (request) => {
    return await InternalStudyInteractor.getStudy(
      request.params['studyName'] as string
    );
  };
}
