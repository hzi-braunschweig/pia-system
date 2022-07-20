/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  AccessToken,
  hasRealmRole,
  MissingPermissionError,
  Nullable,
} from '../../../../src';
import { Example } from '../../models/example';

export class AdminExampleInteractor {
  public static getExample(
    decodedToken: AccessToken,
    study: string,
    name: string
  ): Nullable<Example> {
    if (hasRealmRole('Forscher', decodedToken)) {
      return {
        study: study,
        name: name,
        age: 21,
      };
    } else if (hasRealmRole('Untersuchungsteam', decodedToken)) {
      return {
        study: study,
        name: name,
        age: 42,
      };
    } else if (hasRealmRole('SysAdmin', decodedToken)) {
      return {
        study: study,
        name: name,
        age: 84,
      };
    } else {
      throw new MissingPermissionError();
    }
  }
}
