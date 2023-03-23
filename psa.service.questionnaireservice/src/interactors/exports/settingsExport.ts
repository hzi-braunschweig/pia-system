/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import { Readable } from 'stream';
import { CsvService } from '../../services/csvService';
import { SettingsTransform } from '../../services/csvTransformStreams/settingsTransform';

export class SettingsExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    const settingsStream: Readable = await this.getSettingsStream(
      this.probandPseudonyms
    );
    const transformStream = new SettingsTransform();
    const csvStream = CsvService.stringify();
    this.archive.append(settingsStream.pipe(transformStream).pipe(csvStream), {
      name: 'settings.csv',
    });

    return Promise.resolve();
  }

  private async getSettingsStream(probands: string[]): Promise<Readable> {
    return await this.dbPool.manager
      .createQueryBuilder()
      .from('probands', 'p')
      .select([
        'p.pseudonym',
        'p.compliance_labresults',
        'p.compliance_samples',
        'p.compliance_bloodsamples',
        'p.is_test_proband',
        'p.ids',
      ])
      .where('p.pseudonym IN (:...probands)', { probands })
      .stream();
  }
}
