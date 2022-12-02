/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import * as pgHelper from '../../services/postgresqlHelper';
import { Readable } from 'stream';
import { CsvService } from '../../services/csvService';
import { LabResultTransform } from '../../services/csvTransformStreams/labResultTransform';

export class LabResultsExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    const labResultsStream: Readable = pgHelper.streamLabResults(
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
}
