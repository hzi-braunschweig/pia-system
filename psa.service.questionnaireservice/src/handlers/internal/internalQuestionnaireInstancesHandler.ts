/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { InternalQuestionnaireInstancesInteractor } from '../../interactors/internalQuestionnaireInstancesInteractor';

export class InternalQuestionnaireInstancesHandler {
  public static getOne: Lifecycle.Method = async (request) => {
    const id = request.params['id'] as number;
    return await InternalQuestionnaireInstancesInteractor.getQuestionnaireInstance(
      id
    );
  };
}
