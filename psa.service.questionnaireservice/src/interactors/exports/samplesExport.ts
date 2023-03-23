/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import { Readable } from 'stream';
import { CsvService } from '../../services/csvService';
import { SampleTransform } from '../../services/csvTransformStreams/sampleTransform';

export class SamplesExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    const samplesStream: Readable = await this.getSamplesStream(
      this.probandPseudonyms
    );
    const transformStream = new SampleTransform();
    const csvStream = CsvService.stringify();
    this.archive.append(samplesStream.pipe(transformStream).pipe(csvStream), {
      name: 'samples.csv',
    });

    return Promise.resolve();
  }

  private async getSamplesStream(probands: string[]): Promise<Readable> {
    return await this.dbPool.manager
      .createQueryBuilder()
      .select([
        'lr.id',
        'lr.user_id',
        'lr.status',
        'lr.remark',
        'lr.dummy_sample_id',
        'lr.study_status',
        'p.ids',
      ])
      .from('lab_results', 'lr')
      .leftJoin('probands', 'p', 'lr.user_id = p.pseudonym')
      .where('lr.user_id IN (:...probands)', { probands })
      .orderBy('lr.user_id')
      .addOrderBy('lr.id')
      .addOrderBy('lr.study_status')
      .addOrderBy('lr.status')
      .stream();
  }
}
