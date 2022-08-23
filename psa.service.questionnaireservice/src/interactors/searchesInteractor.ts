/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import * as pgHelper from '../services/postgresqlHelper';
import { Readable } from 'stream';
import * as csv from 'csv-stringify';
import archiver, { Archiver } from 'archiver';
import { UserFile } from '../models/userFile';
import { AccessToken, assertStudyAccess } from '@pia/lib-service-core';
import { AnswersTransform } from '../services/csvTransformStreams/answersTransform';
import { LabResultTransform } from '../services/csvTransformStreams/labResultTransform';
import { SampleTransform } from '../services/csvTransformStreams/sampleTransform';
import { BloodSampleTransform } from '../services/csvTransformStreams/bloodSampleTransform';
import { SettingsTransform } from '../services/csvTransformStreams/settingsTransform';
import { userserviceClient } from '../clients/userserviceClient';

export interface SearchCriteria {
  start_date: Date | null;
  end_date: Date | null;
  study_name: string;
  questionnaires: number[] | null;
  probands: string[];
  exportAnswers: boolean;
  exportLabResults: boolean;
  exportSamples: boolean;
  exportSettings: boolean;
}

export class SearchesInteractor {
  /**
   * Creates a data search and returns the search result as a stream
   */
  public static async createSearch(
    decodedToken: AccessToken,
    searchCriteria: SearchCriteria
  ): Promise<Archiver> {
    assertStudyAccess(searchCriteria.study_name, decodedToken);

    return await SearchesInteractor.search(searchCriteria);
  }

  /**
   * Searches for the given data and resolves the result in a zip as a readable stream.
   * @param searchCriteria
   * @return {Promise<stream.Readable>}
   */
  private static async search(
    searchCriteria: SearchCriteria
  ): Promise<Archiver> {
    const start_date = searchCriteria.start_date
      ? new Date(searchCriteria.start_date)
      : new Date(0);
    const end_date = searchCriteria.end_date
      ? new Date(searchCriteria.end_date)
      : new Date();

    const {
      study_name,
      questionnaires,
      probands,

      exportAnswers,
      exportLabResults,
      exportSamples,
      exportSettings,
    } = searchCriteria;

    // Keep the interface compatible to the existing frontend,
    // but use these aliases for a more uniform and future proof code body.
    const exportFiles = true;
    const exportBloodSamples = exportSamples;

    if (exportAnswers && (!questionnaires || questionnaires.length === 0)) {
      throw Boom.badData('Unable to export answers without questionnaires.');
    }
    if (!study_name) {
      throw Boom.badData('Unable to export for undefined study');
    }

    const allProbandsOfStudy = await userserviceClient.getPseudonyms({
      study: study_name,
    });
    const foundProbands = allProbandsOfStudy.filter((pseudonym) =>
      probands.includes(pseudonym)
    );

    if (foundProbands.length === 0) {
      throw Boom.badData('There was no Proband found.');
    }

    const archive = archiver('zip');

    if (exportAnswers) {
      const answersStream = pgHelper.streamAnswers(
        questionnaires,
        foundProbands,
        start_date,
        end_date,
        study_name
      ) as Readable;
      const transformStream = new AnswersTransform();
      const csvStream = csv.stringify({ header: true });
      archive.append(answersStream.pipe(transformStream).pipe(csvStream), {
        name: 'answers.csv',
      });

      // see declaration of exportFiles
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (exportFiles) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        transformStream.on('end', async () => {
          const fileIDs = transformStream.getContainedFileIDs();
          if (fileIDs.length > 0) {
            const filesStream = pgHelper.streamFiles(
              fileIDs
            ) as AsyncIterable<UserFile>;
            for await (const file of filesStream) {
              const base64EncodingMark = ';base64,';
              const base64EncodingMarkIndex =
                file.file.indexOf(base64EncodingMark);
              if (base64EncodingMarkIndex !== -1) {
                const fileData = Buffer.from(
                  file.file.substring(
                    base64EncodingMarkIndex + base64EncodingMark.length
                  ),
                  'base64'
                );
                archive.append(fileData, {
                  name: `files/${file.id.toString()}-${file.file_name ?? ''}`,
                });
              }
            }
          }
          archive
            .finalize()
            .then(() => {
              console.log('Zip for export without files was finalized');
            })
            .catch((err) => {
              console.log(
                'Finalizing the zip without files was not possible:',
                err
              );
            });
        });
      }
    }

    if (exportLabResults) {
      const labResultsStream = pgHelper.streamLabResults(
        foundProbands,
        start_date,
        end_date
      ) as Readable;
      const transformStream = new LabResultTransform();
      const csvStream = csv.stringify({ header: true });
      archive.append(labResultsStream.pipe(transformStream).pipe(csvStream), {
        name: 'lab_results.csv',
      });
    }

    if (exportSamples) {
      const samplesStream = pgHelper.streamSamples(foundProbands) as Readable;
      const transformStream = new SampleTransform();
      const csvStream = csv.stringify({ header: true });
      archive.append(samplesStream.pipe(transformStream).pipe(csvStream), {
        name: 'samples.csv',
      });
    }

    if (exportBloodSamples) {
      const bloodSamplesStream = pgHelper.streamBloodSamples(
        foundProbands
      ) as Readable;
      const transformStream = new BloodSampleTransform();
      const csvStream = csv.stringify({ header: true });
      archive.append(bloodSamplesStream.pipe(transformStream).pipe(csvStream), {
        name: 'blood_samples.csv',
      });
    }

    if (exportSettings) {
      const settingsStream = pgHelper.streamSettings(foundProbands) as Readable;
      const transformStream = new SettingsTransform();
      const csvStream = csv.stringify({ header: true });
      archive.append(settingsStream.pipe(transformStream).pipe(csvStream), {
        name: 'settings.csv',
      });
    }
    // see declaration of exportFiles
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!(exportAnswers && exportFiles)) {
      archive
        .finalize()
        .then(() => {
          console.log('Zip for export without files was finalized');
        })
        .catch((err) => {
          console.log(
            'Finalizing the zip without files was not possible:',
            err
          );
        });
    }
    return archive;
  }
}
