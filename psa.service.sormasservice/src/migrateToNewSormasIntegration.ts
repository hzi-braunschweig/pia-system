/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { userserviceClient } from './clients/userserviceClient';
import { config } from './config';
import { PassThrough, pipeline as callbackPipeline, Readable } from 'stream';
import { SymptomDiaryService } from './services/symptomDiaryService';
import {
  ProbandNotFoundError,
  SormasFetchPersonError,
  UpdateFollowUpError,
  UpdatePersonalDataError,
} from './errors';
import { promisify } from 'util';
import { questionnaireserviceClient } from './clients/questionnaireserviceClient';
import { getRepository } from 'typeorm';
import { SymptomTransmission } from './entities/symptomTransmission';
import { DeepPartial } from 'typeorm/common/DeepPartial';
import { connectDatabase } from './db';
import { personaldataserviceClient } from './clients/personaldataserviceClient';
import { SormasClient } from './clients/sormasClient';
import { ProbandStatus } from '@pia-system/lib-http-clients-internal';

const pipeline = promisify(callbackPipeline);

/**
 * Get all users of sormas study
 */
async function* getPseudonyms(): AsyncGenerator<string, void, undefined> {
  const pseudonyms = await userserviceClient.getPseudonyms({
    study: config.sormas.study,
    probandStatus: ProbandStatus.ACTIVE,
  });
  yield* pseudonyms;
}

class UpdatePersonalDataAndFollowUpStream extends PassThrough {
  public objectMode = true;
  public failedUpdate = 0;
  public successfulUpdate = 0;

  public async _write(
    pseudonym: string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): Promise<void> {
    console.log('UPDATE personal data for: ' + pseudonym);
    try {
      await SymptomDiaryService.updateProbandDataFromSormas({
        pseudonym: pseudonym,
      });
      this.successfulUpdate++;
    } catch (e) {
      if (e instanceof ProbandNotFoundError) {
        console.error(
          'No UUID could be found for the pseudonym. Maybe this proband was created manually.',
          e
        );
      } else if (e instanceof SormasFetchPersonError) {
        console.warn(
          'Proband could not be found in SORMAS, please check if it must be deleted manually:',
          e
        );
      } else if (e instanceof UpdatePersonalDataError) {
        console.error(
          'Updating personal data did not work for ' + pseudonym,
          e
        );
      } else if (e instanceof UpdateFollowUpError) {
        console.error('Updating follow up did not work for ' + pseudonym, e);
      } else {
        return callback(e as Error);
      }
      this.failedUpdate++;
    }
    super._write(pseudonym, encoding, callback);
  }
}

class TransferSymptomTransmissionDates extends PassThrough {
  public objectMode = true;
  public successfulTransfer = 0;
  public failedTransfer = 0;
  public sumTransferredTransmissions = 0;

  public async _write(
    pseudonym: string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): Promise<void> {
    try {
      console.log('TRANSFER symptom transmissions for: ' + pseudonym);
      // Get all questionnaire instances
      const questionnaireInstances =
        await questionnaireserviceClient.getQuestionnaireInstancesForProband(
          pseudonym
        );
      const transferredTransmissions: DeepPartial<SymptomTransmission>[] = [];
      const transmissionRepo = getRepository(SymptomTransmission);
      for (const questionnaireInstance of questionnaireInstances) {
        if (
          questionnaireInstance.status === 'released_once' ||
          questionnaireInstance.status === 'released_twice'
        ) {
          if (questionnaireInstance.transmissionTsV1) {
            const count = await transmissionRepo.count({
              questionnaireInstanceId: questionnaireInstance.id,
              version: 1,
            });
            if (count === 0) {
              transferredTransmissions.push({
                pseudonym: pseudonym,
                study: config.sormas.study,
                questionnaireInstanceId: questionnaireInstance.id,
                version: 1,
                transmissionDate: questionnaireInstance.transmissionTsV1,
              });
            }
          }
        }
        if (questionnaireInstance.status === 'released_twice') {
          if (questionnaireInstance.transmissionTsV2) {
            const count = await transmissionRepo.count({
              questionnaireInstanceId: questionnaireInstance.id,
              version: 2,
            });
            if (count === 0) {
              transferredTransmissions.push({
                pseudonym: pseudonym,
                study: config.sormas.study,
                questionnaireInstanceId: questionnaireInstance.id,
                version: 2,
                transmissionDate: questionnaireInstance.transmissionTsV2,
              });
            }
          }
        }
      }
      await transmissionRepo.save(transferredTransmissions);
      this.sumTransferredTransmissions += transferredTransmissions.length;
      this.successfulTransfer++;
    } catch (e) {
      console.error(e);
      this.failedTransfer++;
    }
    super._write(pseudonym, encoding, callback);
  }
}

class ObjectCounter extends PassThrough {
  public objectMode = true;
  public count = 0;

  public _write(
    pseudonym: string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.count++;
    super._write(pseudonym, encoding, callback);
  }
}

export async function migrateToNewSormasIntegration(): Promise<void> {
  // wait for services
  await userserviceClient.waitForService();
  await questionnaireserviceClient.waitForService();
  await personaldataserviceClient.waitForService();
  await SormasClient.waitForService();

  // connect DB
  await connectDatabase();

  // get pseudonyms of sormas study as stream
  const pseudonymStream = Readable.from(getPseudonyms());
  const pseudonymCounter = new ObjectCounter();
  const updatePersonalDataAndFollowUpStream =
    new UpdatePersonalDataAndFollowUpStream();
  const transferSymptomTransmissionDates =
    new TransferSymptomTransmissionDates();

  await pipeline(
    pseudonymStream,
    pseudonymCounter,
    updatePersonalDataAndFollowUpStream,
    transferSymptomTransmissionDates
  ).catch((e) => {
    console.log('== MIGRATION FAILED ==');
    console.error('The migration was not successfully:', e);
    throw e;
  });
  console.log('== MIGRATION COMPLETED ==');
  console.log(
    `${pseudonymCounter.count}\t probands were found in pia in sormas study.`
  );
  console.log(
    `${updatePersonalDataAndFollowUpStream.successfulUpdate}\t probands could be updated.`
  );
  console.log(
    `${updatePersonalDataAndFollowUpStream.failedUpdate}\t probands could not be updated.`
  );
  console.log(
    `${transferSymptomTransmissionDates.successfulTransfer}\t proband's symptom transmissions could be transferred into the new db table with a total of ${transferSymptomTransmissionDates.sumTransferredTransmissions} symptom transmissions`
  );
  console.log(
    `${transferSymptomTransmissionDates.failedTransfer}\t proband's symptom transmissions could not be transferred into the new db table`
  );
}
