/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LabObservationName } from '../models/LabObservation';
import postgresqlHelper from '../services/postgresqlHelper';

export class LaboratoryObservationsInteractor {
  public static async getLabObservationNames(): Promise<LabObservationName[]> {
    return (await postgresqlHelper.getLabObservationNames()) as LabObservationName[];
  }
}
