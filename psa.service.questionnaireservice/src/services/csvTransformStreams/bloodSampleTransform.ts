/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BloodSample } from '../../models/sample';
import { CsvBloodSampleRow } from '../../models/csvExportRows';
import { CsvTransform } from './csvTransform';

export class BloodSampleTransform extends CsvTransform<
  BloodSample,
  CsvBloodSampleRow
> {
  /**
   * Transforms a blood sample into a csv blood sample line object.
   */
  protected convertToCsvRow(sample: BloodSample): CsvBloodSampleRow {
    return {
      Blutproben_ID: sample.sample_id,
      Proband:
        sample.ids?.toLowerCase() === sample.user_id ? '' : sample.user_id,
      IDS: sample.ids ?? '',
      Status: sample.blood_sample_carried_out ? 'genommen' : 'nicht genommen',
      Bemerkung: sample.remark ? sample.remark : '.',
    };
  }
}
