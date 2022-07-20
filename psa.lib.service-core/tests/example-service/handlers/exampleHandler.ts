/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { ExampleInteractor } from '../interactors/exampleInteractor';

export class ExampleHandler {
  public static getExample: Lifecycle.Method = (request) => {
    return ExampleInteractor.getExample(request.params['name'] as string);
  };
}
