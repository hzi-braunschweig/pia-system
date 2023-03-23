/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import { Readable } from 'stream';
import { CsvService } from '../../services/csvService';
import { LegacyAnswersTransform } from '../../services/csvTransformStreams/legacyAnswersTransform';
import { UserFile } from '../../models/userFile';

/**
 * The old export will be kept, as long as data analysis is done with
 * its format. As soon as the new export format is widely accepted, it will be
 * removed. Therefor we marked this export as "legacy".
 */
export class LegacyAnswersExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    const answersStream: Readable = (
      await this.getAnswersStream(
        this.probandPseudonyms,
        this.options.questionnaires ?? [],
        this.options.study_name,
        this.startDate,
        this.endDate
      )
    ).on('error', (error) => {
      throw error;
    });
    const transformStream = new LegacyAnswersTransform();
    const csvStream = CsvService.stringify();
    this.archive.append(answersStream.pipe(transformStream).pipe(csvStream), {
      name: 'answers.csv',
    });

    return new Promise<void>((resolve, reject) => {
      transformStream
        .on('error', (error) => reject(error.message))
        // We need await in this callback, to be able to await the AsyncIterable.
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .on('end', async () => {
          const fileIDs = transformStream.getContainedFileIDs();
          if (fileIDs.length > 0) {
            const filesStream = (await this.getFilesStream(fileIDs)).on(
              'error',
              (error) => reject(error.message)
            );

            for await (const file of filesStream as AsyncIterable<UserFile>) {
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
                this.archive.append(fileData, {
                  name: `files/${file.id.toString()}-${file.file_name ?? ''}`,
                });
              }
            }
          }
          resolve();
        });
    });
  }

  public async getAnswersStream(
    probands: string[],
    questionnaires: { id: number; version: number }[],
    studyName: string,
    startDate: Date,
    endDate: Date
  ): Promise<Readable> {
    const questionnaireTuples = questionnaires
      /**
       * `questionnaireTuples` is being inserted into the SQL query below.
       * We double-check the types here to prevent SQL injection.
       * The reason for the raw string insertion is the missing ability of
       * TypeORM to handle tuples in raw queries
       */
      .filter((q) => typeof q.id === 'number' && typeof q.version === 'number')
      .map((q) => `(${q.id},${q.version})`)
      .join(',');

    return this.dbPool.manager
      .createQueryBuilder()
      .from('questionnaires', 'q')
      .select([
        'qi.questionnaire_name',
        'qi.questionnaire_version',
        'qi.user_id',
        'qi.date_of_release_v1',
        'qi.date_of_release_v2',
        'qi.date_of_issue',
        'qi.status            AS status',
        'quest.variable_name  AS question_variable_name',
        'quest.position       AS qposition',
        'ao.variable_name     AS answer_option_variable_name',
        'ao.position          AS aposition',
        'ao.values            AS values',
        'ao.values_code',
        'ao.answer_type_id    AS a_type',
        'a.versioning         AS versioning',
        'a.value              AS value',
        'a.date_of_release',
        'p.ids',
      ])
      .innerJoin(
        'questions',
        'quest',
        'quest.questionnaire_id = q.id AND quest.questionnaire_version = q.version'
      )
      .innerJoin('answer_options', 'ao', 'ao.question_id = quest.id')
      .innerJoin(
        'questionnaire_instances',
        'qi',
        'q.id = qi.questionnaire_id AND q.version = qi.questionnaire_version'
      )
      .leftJoin('probands', 'p', 'qi.user_id = p.pseudonym')
      .leftJoin(
        'answers',
        'a',
        `
         ao.id = a.answer_option_id AND 
         qi.id = a.questionnaire_instance_id AND
         (qi.status = 'released_once' OR
          qi.status = 'released_twice' OR
          qi.status = 'released' OR
          (qi.status = 'in_progress' AND q.type = 'for_research_team'))
        `
      )
      .where('q.study_id = :studyName', { studyName })
      .andWhere(
        `(qi.questionnaire_id, qi.questionnaire_version) IN (${questionnaireTuples})`
      )
      .andWhere('qi.user_id IN (:...probands)', { probands })
      .andWhere("qi.status != 'inactive'")
      .andWhere('qi.date_of_issue >= :startDate', { startDate })
      .andWhere('qi.date_of_issue <= :endDate', { endDate })
      .orderBy('questionnaire_name')
      .addOrderBy('questionnaire_version')
      .addOrderBy('user_id')
      .addOrderBy('date_of_issue')
      .addOrderBy('qposition')
      .addOrderBy('aposition')
      .addOrderBy('versioning')
      .stream();
  }

  private async getFilesStream(fileIDs: string[]): Promise<Readable> {
    return this.dbPool.manager
      .createQueryBuilder()
      .select(['f.id AS id', 'f.file_name AS file_name', 'f.file AS file'])
      .from('user_files', 'f')
      .where('f.id IN (:...fileIDs)', { fileIDs })
      .stream();
  }
}
