/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { handleError } from '../handleError';
import { LaboratoryObservationsInteractor } from '../interactors/laboratoryObservationsInteractor';

export class LaboratoryObservationsHandler {
  public static async getLabObservationNames(
    this: void,
    _request: Request
  ): Promise<unknown> {
    return LaboratoryObservationsInteractor.getLabObservationNames().catch(
      handleError
    );
  }
}
