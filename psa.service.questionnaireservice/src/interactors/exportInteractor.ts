/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import archiver, { Archiver } from 'archiver';
import {
  AccessToken,
  assertStudyAccess,
  asyncForEach,
} from '@pia/lib-service-core';
import { userserviceClient } from '../clients/userserviceClient';
import {
  availableExportFeatures,
  AvailableExportKeys,
} from './exports/availableExportFeatures';
import { ExportFeature } from './exports/exportFeature';

export interface ExportOptions {
  start_date: Date | null;
  end_date: Date | null;
  study_name: string;
  questionnaires: { id: number; version: number }[] | null;
  probands: string[];
  exports: AvailableExportKeys[];
}

export class ExportInteractor {
  /**
   * Creates a export and returns the result as a stream
   */
  public static async export(
    decodedToken: AccessToken,
    searchCriteria: ExportOptions
  ): Promise<Archiver> {
    assertStudyAccess(searchCriteria.study_name, decodedToken);

    return await ExportInteractor.aggregate(searchCriteria);
  }

  /**
   * Aggregates the requested data and returns a zip as a readable stream.
   * @param options
   * @return {Promise<stream.Readable>}
   */
  private static async aggregate(options: ExportOptions): Promise<Archiver> {
    const startDate = options.start_date
      ? new Date(options.start_date)
      : new Date(0);
    const endDate = options.end_date ? new Date(options.end_date) : new Date();

    const { study_name, questionnaires, probands } = options;

    if (
      (options.exports.includes('answers') ||
        options.exports.includes('codebook')) &&
      (!questionnaires || questionnaires.length === 0)
    ) {
      throw Boom.badData(
        'Unable to export answers and/or codebook without questionnaires.'
      );
    }
    if (!study_name) {
      throw Boom.badData('Unable to export for undefined study.');
    }

    if (options.probands.length > 0) {
      const allProbandsOfStudy = await userserviceClient.getPseudonyms({
        study: study_name,
      });
      const foundProbands = allProbandsOfStudy.filter((pseudonym) =>
        probands.includes(pseudonym)
      );

      if (foundProbands.length === 0) {
        throw Boom.badData('There was no proband found.');
      }
    }

    const archive = archiver('zip');

    const exportInstances = options.exports
      .concat('readme')
      .filter((key) => availableExportFeatures.has(key))
      .map((key) => availableExportFeatures.get(key))
      .map(
        (exportClass) =>
          // We filter all non-existent keys, so we certainly know what the value will be at this point.
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          new exportClass!(startDate, endDate, options, archive, probands)
      );

    void ExportInteractor.streamExportsToArchive(exportInstances, archive);

    return archive;
  }

  private static async streamExportsToArchive(
    exportInstances: ExportFeature[],
    archive: Archiver
  ): Promise<void> {
    try {
      await asyncForEach(exportInstances, async (exportInstance) => {
        await exportInstance.apply();
      });
      await archive.finalize();
      console.log('Zip for export was finalized');
    } catch (err) {
      archive.emit('error', err);
      console.error('Error during export:', err);
    }
  }
}
