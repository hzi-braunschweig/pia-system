/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Nullable } from '../../../src';
import { Example } from '../models/example';

export class ExampleInteractor {
  public static getExample(name: string): Nullable<Example> {
    return {
      name: name,
      age: 21,
    };
  }
}
