/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { AdminExampleInteractor } from '../../interactors/admin/adminExampleInteractor';
import { CredentialsExtra } from '../../../../src';

export class AdminExampleHandler {
  public static getExample: Lifecycle.Method<{
    AuthCredentialsExtra: CredentialsExtra;
  }> = (request) => {
    return AdminExampleInteractor.getExample(
      request.auth.credentials,
      request.params['studyName'] as string,
      request.params['name'] as string
    );
  };
}
