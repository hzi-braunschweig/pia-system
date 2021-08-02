/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import * as pgHelper from '../services/postgresqlHelper';
import { Readable } from 'stream';
import stringify from 'csv-stringify';
import archiver from 'archiver';
import { File } from '../models/file';
import { AccessToken } from '@pia/lib-service-core';
import { AnswersTransform } from '../services/csvTransformStreams/answersTransform';
import { LabResultTransform } from '../services/csvTransformStreams/labResultTransform';
import { SampleTransform } from '../services/csvTransformStreams/sampleTransform';
import { BloodSampleTransform } from '../services/csvTransformStreams/bloodSampleTransform';
import { SettingsTransform } from '../services/csvTransformStreams/settingsTransform';

interface SearchCriteria {
  start_date?: Date;
  end_date?: Date;
  study_name: string;
  questionnaires?: number[];
  probands?: string[];
  exportAnswers?: boolean;
  exportLabResults?: boolean;
  exportSamples?: boolean;
  exportSettings?: boolean;
}

export class SearchesInteractor {
  /**
   * Creates a data search and returns the search result as a stream
   * @param {string} decodedToken the jwt of the request
   * @param {object} searchCriteria the criteria for searching
   * @returns a readable stream that fetches the data from the DB and converts them into a zip
   * @throws {Boom}
   */
  public static async createSearch(
    decodedToken: AccessToken,
    searchCriteria: SearchCriteria
  ): Promise<Readable> {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Forscher':
        try {
          await pgHelper.getStudyAccessForUser(
            searchCriteria.study_name,
            userName
          );
        } catch (err) {
          console.log(err);
          throw Boom.forbidden(
            'Could not create the search, because user has no access to study'
          );
        }
        return await SearchesInteractor.search(searchCriteria);
      default:
        throw Boom.forbidden(
          'Could not create the search: Unknown or wrong role'
        );
    }
  }

  /**
   * Searches for the given data and resolves the result in a zip as a readable stream.
   * @param searchCriteria
   * @return {Promise<stream.Readable>}
   */
  private static async search(
    searchCriteria: SearchCriteria
  ): Promise<Readable> {
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

    let foundProbands: string[];
    try {
      foundProbands = (await pgHelper.findProbandNamesInStudy(
        probands,
        study_name
      )) as string[];
    } catch (err) {
      console.log(err);
      throw Boom.internal('Something went wrong while connecting to the db.');
    }

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
      const csvStream = stringify({ header: true });
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
            ) as AsyncIterable<File>;
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
                  name: 'files/' + file.id.toString() + '-' + file.file_name,
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
      const csvStream = stringify({ header: true });
      archive.append(labResultsStream.pipe(transformStream).pipe(csvStream), {
        name: 'lab_results.csv',
      });
    }

    if (exportSamples) {
      const samplesStream = pgHelper.streamSamples(foundProbands) as Readable;
      const transformStream = new SampleTransform();
      const csvStream = stringify({ header: true });
      archive.append(samplesStream.pipe(transformStream).pipe(csvStream), {
        name: 'samples.csv',
      });
    }

    if (exportBloodSamples) {
      const bloodSamplesStream = pgHelper.streamBloodSamples(
        foundProbands
      ) as Readable;
      const transformStream = new BloodSampleTransform();
      const csvStream = stringify({ header: true });
      archive.append(bloodSamplesStream.pipe(transformStream).pipe(csvStream), {
        name: 'blood_samples.csv',
      });
    }

    if (exportSettings) {
      const settingsStream = pgHelper.streamSettings(foundProbands) as Readable;
      const transformStream = new SettingsTransform();
      const csvStream = stringify({ header: true });
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
