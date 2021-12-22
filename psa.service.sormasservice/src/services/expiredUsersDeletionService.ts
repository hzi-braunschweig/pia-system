/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { userserviceClient } from '../clients/userserviceClient';
import { FindConditions, getRepository, In, LessThanOrEqual } from 'typeorm';
import { FollowUp } from '../entities/followUp';
import stream, { Readable, Writable } from 'stream';
import { promisify } from 'util';
import { questionnaireserviceClient } from '../clients/questionnaireserviceClient';
import { QuestionnaireInstance } from '../models/questionnaireInstance';
import { SymptomTransmission } from '../entities/symptomTransmission';
import { ProbandStatus } from '@pia-system/lib-http-clients-internal';

const pipeline = promisify(stream.pipeline);

export class ExpiredUsersDeletionService {
  public static async setProbandsDeactivatedIfFollowUpEndDateIsReached(): Promise<void> {
    console.info(
      `(ℹ️) ExpiredUsersDeletionService: Searching for probands to be deactivated if their follow up end date is reached...`
    );
    let probandsDeactivatedCount = 0;
    const expiredFollowUpsReadable = this.getExpiredFollowUpsAsStream();
    const statusUpdateWritable = new Writable({
      objectMode: true,
      async write(
        expiredFollowUp: FollowUp,
        _encoding: BufferEncoding,
        callback: (error?: Error | null) => void
      ): Promise<void> {
        try {
          await userserviceClient.patchProband(expiredFollowUp.pseudonym, {
            status: ProbandStatus.DEACTIVATED,
          });
          ++probandsDeactivatedCount;
          callback();
        } catch (err) {
          callback(err as Error);
        }
      },
    });
    await pipeline(expiredFollowUpsReadable, statusUpdateWritable);
    console.info(
      `(ℹ️) ExpiredUsersDeletionService: Deactivated ${probandsDeactivatedCount} probands`
    );
  }

  /**
   *
   * @param pseudonym if undefined all probands are checked; if specified only the specified one
   */
  public static async deleteProbandsIfEveryQIIsReleasedAndTransmitted(
    pseudonym?: string
  ): Promise<void> {
    console.info(
      `(ℹ️) ExpiredUsersDeletionService: Searching for probands to be deleted if their symptoms were transmitted to SORMAS...`
    );
    let probandsDeletedCount = 0;
    const expiredFollowUpsReadable =
      this.getExpiredFollowUpsAsStream(pseudonym);
    const statusUpdateWritable = new Writable({
      objectMode: true,
      async write(
        expiredFollowUp: FollowUp,
        _encoding: BufferEncoding,
        callback: (error?: Error | null) => void
      ): Promise<void> {
        try {
          if (
            await ExpiredUsersDeletionService.isEveryQIReleasedAndTransmitted(
              expiredFollowUp.pseudonym
            )
          ) {
            await userserviceClient.deleteProbanddata(
              expiredFollowUp.pseudonym,
              true,
              false
            );
            ++probandsDeletedCount;
          }
          callback();
        } catch (err) {
          callback(err as Error);
        }
      },
    });
    await pipeline(expiredFollowUpsReadable, statusUpdateWritable);
    console.info(
      `(ℹ️) ExpiredUsersDeletionService: Deleted ${probandsDeletedCount} probands`
    );
  }

  private static getExpiredFollowUpsAsStream(pseudonym?: string): Readable {
    // could possibly be changed to a readable stream from database when typeorm supports entities as stream (currently only raw supported)
    return Readable.from(
      ExpiredUsersDeletionService.getExpiredFollowUps(pseudonym),
      {
        objectMode: true,
      }
    );
  }

  private static async *getExpiredFollowUps(
    pseudonym?: string
  ): AsyncGenerator<FollowUp, void, undefined> {
    const findCondition: FindConditions<FollowUp>[] = [
      {
        endDate: LessThanOrEqual(new Date()),
      },
      {
        endDate: null,
      },
    ];
    if (pseudonym) {
      findCondition.forEach((condition) => (condition.pseudonym = pseudonym));
    }
    const expiredFollowUps = await getRepository(FollowUp).find({
      where: findCondition,
    });
    yield* expiredFollowUps;
  }

  /**
   * We do not want to delete users which have active or upcoming questionnaire instances OR
   * released questionnaire answers which are not transferred to SORMAS yet.
   */
  private static async isEveryQIReleasedAndTransmitted(
    pseudonym: string
  ): Promise<boolean> {
    const symptomTransmissionRepository = getRepository(SymptomTransmission);
    const instancesReleasedTwice = new Set<number>();
    const questionnaireInstances: QuestionnaireInstance[] =
      await questionnaireserviceClient.getQuestionnaireInstancesForProband(
        pseudonym
      );

    for (const questionnaireInstance of questionnaireInstances) {
      if (
        ['released_once', 'inactive', 'active', 'in_progress'].includes(
          questionnaireInstance.status
        )
      ) {
        // there are still tasks to do for this proband
        return false;
      } else if (questionnaireInstance.status === 'released_twice') {
        instancesReleasedTwice.add(questionnaireInstance.id);
      }
    }
    // check if each questionnaire instance released twice was also transmitted twice
    const numberOfTransmissionOfInstancesReleasedTwice =
      await symptomTransmissionRepository.count({
        pseudonym: pseudonym,
        version: 2,
        questionnaireInstanceId: In([...instancesReleasedTwice]),
      });
    return (
      instancesReleasedTwice.size ===
      numberOfTransmissionOfInstancesReleasedTwice
    );
  }
}
