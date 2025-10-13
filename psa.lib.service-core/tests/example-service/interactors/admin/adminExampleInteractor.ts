/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  hasRealmRole,
  MissingPermissionError,
  Nullable,
  RequestAuthCredentials,
} from '../../../../src';
import { Example } from '../../models/example';

export class AdminExampleInteractor {
  public static getExample(
    credentials: RequestAuthCredentials,
    study: string,
    name: string
  ): Nullable<Example> {
    if (hasRealmRole('Forscher', credentials)) {
      return {
        study: study,
        name: name,
        age: 21,
      };
    } else if (hasRealmRole('Untersuchungsteam', credentials)) {
      return {
        study: study,
        name: name,
        age: 42,
      };
    } else if (hasRealmRole('SysAdmin', credentials)) {
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
