/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import * as pgHelper from '../../services/postgresqlHelper';
import { Readable } from 'stream';
import { CsvService } from '../../services/csvService';
import { AnswersTransform } from '../../services/csvTransformStreams/answersTransform';
import { UserFile } from '../../models/userFile';

export class AnswersExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    return new Promise<void>((resolve) => {
      const answersStream: Readable = pgHelper.streamAnswers(
        this.options.questionnaires,
        this.probandPseudonyms,
        this.startDate,
        this.endDate,
        this.options.study_name
      );
      const transformStream = new AnswersTransform();
      const csvStream = CsvService.stringify();
      this.archive.append(answersStream.pipe(transformStream).pipe(csvStream), {
        name: 'answers.csv',
      });

      // We need await in this callback, to be able to await the AsyncIterable.
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
}
