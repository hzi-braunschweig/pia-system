/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import * as pgHelper from '../../services/postgresqlHelper';
import { Readable } from 'stream';
import { CsvService } from '../../services/csvService';
import { SampleTransform } from '../../services/csvTransformStreams/sampleTransform';

export class SamplesExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    const samplesStream: Readable = pgHelper.streamSamples(
      this.probandPseudonyms
    );
    const transformStream = new SampleTransform();
    const csvStream = CsvService.stringify();
    this.archive.append(samplesStream.pipe(transformStream).pipe(csvStream), {
      name: 'samples.csv',
    });

    return Promise.resolve();
  }
}
