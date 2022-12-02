/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import * as pgHelper from '../../services/postgresqlHelper';
import { Readable } from 'stream';
import { CsvService } from '../../services/csvService';
import { BloodSampleTransform } from '../../services/csvTransformStreams/bloodSampleTransform';

export class BloodSamplesExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    const bloodSamplesStream: Readable = pgHelper.streamBloodSamples(
      this.probandPseudonyms
    );
    const transformStream = new BloodSampleTransform();
    const csvStream = CsvService.stringify();
    this.archive.append(
      bloodSamplesStream.pipe(transformStream).pipe(csvStream),
      {
        name: 'blood_samples.csv',
      }
    );

    return Promise.resolve();
  }
}
