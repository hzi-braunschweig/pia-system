/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import { Readable } from 'stream';
import { CsvService } from '../../services/csvService';
import { BloodSampleTransform } from '../../services/csvTransformStreams/bloodSampleTransform';

export class BloodSamplesExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    const bloodSamplesStream: Readable = await this.getBloodSamplesStream(
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

  private async getBloodSamplesStream(probands: string[]): Promise<Readable> {
    return this.dbPool.manager
      .createQueryBuilder()
      .from('blood_samples', 'bs')
      .select([
        'bs.sample_id',
        'bs.user_id',
        'bs.remark',
        'bs.blood_sample_carried_out',
        'p.ids',
      ])
      .leftJoin('probands', 'p', 'bs.user_id = p.pseudonym')
      .where('bs.user_id IN (:...probands)', { probands })
      .orderBy('bs.user_id')
      .addOrderBy('bs.sample_id')
      .stream();
  }
}
