/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';

import internalComplianceInteractor from '../../interactors/internal/internalComplianceInteractor';

/**
 * This class is responsible for handling requests regarding the compliance a user has given
 */
export class InternalComplianceHandler {
  public static hasComplianceAgree: Lifecycle.Method = async (request) => {
    return internalComplianceInteractor.hasComplianceAgree(
      request,
      request.params['studyName'] as string,
      request.params['pseudonym'] as string,
      request.query['system'] as string[],
      request.query['generic'] as string[]
    );
  };
}
