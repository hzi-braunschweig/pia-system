/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import { Readable } from 'stream';
import { CsvService } from '../../services/csvService';
import { LabResultTransform } from '../../services/csvTransformStreams/labResultTransform';

export class LabResultsExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    const labResultsStream: Readable = await this.getLabResultsStream(
      this.probandPseudonyms,
      this.startDate,
      this.endDate
    );
    const transformStream = new LabResultTransform();
    const csvStream = CsvService.stringify();
    this.archive.append(
      labResultsStream.pipe(transformStream).pipe(csvStream),
      {
        name: 'lab_results.csv',
      }
    );

    return Promise.resolve();
  }

  private async getLabResultsStream(
    probands: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Readable> {
    return await this.dbPool.manager
      .createQueryBuilder()
      .from('lab_results', 'lr')
      .select([
        'lr.user_id',
        'lr.order_id',
        'lr.performing_doctor',
        'lo.lab_result_id',
        'lo.name_id',
        'lo.name',
        'lo.result_value',
        'lo.comment',
        'lo.date_of_analysis',
        'lo.date_of_delivery',
        'lr.date_of_sampling',
        'lo.date_of_announcement',
        'lo.result_string',
        'p.ids',
      ])
      .leftJoin('lab_observations', 'lo', 'lr.id = lo.lab_result_id')
      .leftJoin('probands', 'p', 'lr.user_id = p.pseudonym')
      .where("lr.status = 'analyzed'")
      .andWhere('lr.user_id IN (:...probands)', { probands })
      .andWhere('lr.date_of_sampling >= :startDate', { startDate })
      .andWhere('lr.date_of_sampling <= :endDate', { endDate })
      .orderBy('lo.lab_result_id')
      .addOrderBy('lo.name_id')
      .stream();
  }
}
