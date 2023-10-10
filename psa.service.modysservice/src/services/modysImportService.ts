/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from '../config';
import { PersonalDataMapperStream } from './modysImportStreams/personalDataMapperStream';
import { PersonalDataUpdateStream } from './modysImportStreams/personalDataUpdateStream';
import { FetchModysDataStream } from './modysImportStreams/fetchModysDataStream';
import { getStudysPseudonymsReadable } from './modysImportStreams/studysPseudonymsStream';
import { pipeline } from 'stream/promises';

export class ModysImportService {
  /**
   * Starts the personal data import of all pseudonyms of the configured study
   * from MODYS.
   */
  public static async startImport(): Promise<void> {
    console.log('MODYS Import: ======== START OF IMPORT ========');
    try {
      const studysPseudonymsStream = getStudysPseudonymsReadable(
        config.modys.study
      );
      const fetchModysDataStream = new FetchModysDataStream(config.modys);
      const mapperStream = new PersonalDataMapperStream();
      const personalDataSavingStream = new PersonalDataUpdateStream();

      await pipeline(
        studysPseudonymsStream,
        fetchModysDataStream,
        mapperStream,
        personalDataSavingStream
      );
    } catch (e) {
      console.log(e);
    }
    console.log('MODYS Import: ======== END OF IMPORT ========');
  }
}
