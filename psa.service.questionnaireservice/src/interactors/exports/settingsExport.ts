/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import * as pgHelper from '../../services/postgresqlHelper';
import { Readable } from 'stream';
import { CsvService } from '../../services/csvService';
import { SettingsTransform } from '../../services/csvTransformStreams/settingsTransform';

export class SettingsExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    const settingsStream: Readable = pgHelper.streamSettings(
      this.probandPseudonyms
    );
    const transformStream = new SettingsTransform();
    const csvStream = CsvService.stringify();
    this.archive.append(settingsStream.pipe(transformStream).pipe(csvStream), {
      name: 'settings.csv',
    });

    return Promise.resolve();
  }
}
