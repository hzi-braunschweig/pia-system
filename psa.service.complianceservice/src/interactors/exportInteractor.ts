/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import archiver, { Archiver } from 'archiver';
import { ComplianceService } from '../services/complianceService';
import ComplianceMapper from '../services/complianceMapper';
import * as csv from 'csv-stringify/sync';

export interface ExportOptions {
  studyName: string;
}

export class ExportInteractor {
  /**
   * Creates a export and returns the result as a stream
   */
  public static export(searchCriteria: ExportOptions): Archiver {
    return ExportInteractor.aggregate(searchCriteria);
  }

  /**
   * Aggregates the requested data and returns a zip as a readable stream.
   */
  private static aggregate(options: ExportOptions): Archiver {
    const { studyName } = options;

    if (!studyName) {
      throw Boom.badData('Unable to export for undefined study.');
    }

    const archive = archiver('zip');
    void this.streamExportsToArchive(archive, studyName);

    return archive;
  }

  private static async streamExportsToArchive(
    archive: Archiver,
    studyName: string
  ): Promise<void> {
    try {
      const compliances =
        await ComplianceService.getComplianceAgreementsForStudies(
          [studyName],
          ComplianceMapper.mapComplianceForExport.bind(ComplianceMapper)
        );

      const compliancesCsv = csv.stringify(compliances, {
        header: true,
        delimiter: ';',
      });
      archive.append(compliancesCsv, {
        name: 'compliances.csv',
      });
    } catch (err) {
      archive.emit('error', err);
      console.error('Error during export:', err);
    } finally {
      await archive.finalize();
      console.log('Zip for export was finalized');
    }
  }
}
