/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Request } from '@hapi/hapi';

import { Example } from '../models/example';
import { Nullable } from '../../../src/utils/types';
import { ExampleInteractor } from '../interactors/exampleInteractor';

export class ExampleHandler {
  public static getExample(this: void, request: Request): Nullable<Example> {
    if (!request.params['name']) {
      return null;
    }
    return ExampleInteractor.getExample(request.params['name']);
  }
}
