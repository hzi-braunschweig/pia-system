/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getRepository, InsertResult } from 'typeorm';
import { MapperService } from './mapperService';
import { SormasClient } from '../clients/sormasClient';
import { userserviceClient } from '../clients/userserviceClient';
import { ExpiredUsersDeletionService } from './expiredUsersDeletionService';
import { Answer } from '../models/answer';
import { QuestionnaireInstance } from '../models/questionnaireInstance';
import { SymptomTransmission } from '../entities/symptomTransmission';
import { questionnaireserviceClient } from '../clients/questionnaireserviceClient';
import { SymptomsDto } from '../models/symptomsDto';

type ReleaseVersionOne = 1;
type ReleaseVersionTwo = 2;
type ReleaseVersion = ReleaseVersionOne | ReleaseVersionTwo;

/**
 * @description check and upload questionnaire instances
 */
export class QuestionnaireAnswersTransmissionService {
  private static readonly RELEASE_VERSION_ONE: ReleaseVersionOne = 1;
  private static readonly RELEASE_VERSION_TWO: ReleaseVersionTwo = 2;

  /**
   * Checks released questionnaire instance and might upload to SORMAS
   */
  public static async onQuestionnaireInstanceReleased(
    instanceId: number,
    releaseVersion: number
  ): Promise<void> {
    if (
      releaseVersion === this.RELEASE_VERSION_ONE ||
      releaseVersion === this.RELEASE_VERSION_TWO
    ) {
      await QuestionnaireAnswersTransmissionService.transmitNewQuestionnaireInstanceAnswers(
        instanceId,
        releaseVersion
      );
    } else {
      console.warn(
        `(⚠️) QuestionnaireAnswersTransmissionService: Received questionnaire instance released message for unexpected release version v${releaseVersion} of instance #${instanceId}`
      );
    }
  }

  /**
   * Checks released questionnaire instance and might upload to SORMAS
   */
  private static async transmitNewQuestionnaireInstanceAnswers(
    questionnaireInstanceId: number,
    version: ReleaseVersion
  ): Promise<void> {
    if (
      await QuestionnaireAnswersTransmissionService.isAlreadyTransmitted(
        questionnaireInstanceId,
        version
      )
    ) {
      return;
    }
    console.info(
      `(ℹ️) QuestionnaireAnswersTransmissionService: transmitting new questionnaire instance answers ${questionnaireInstanceId}, v${version}`
    );

    const questionnaireInstance =
      await questionnaireserviceClient.getQuestionnaireInstance(
        questionnaireInstanceId
      );

    const ids = await userserviceClient.lookupIds(
      questionnaireInstance.pseudonym
    );
    if (!ids) {
      console.warn(
        `(⚠️) QuestionnaireAnswersTransmissionService: questionnaire instance's answering user is not registered with UUID: ${questionnaireInstance.id}`
      );
      return;
    }

    const answers: Answer[] =
      await questionnaireserviceClient.getQuestionnaireInstanceAnswers(
        questionnaireInstanceId
      );

    const sormasData: SymptomsDto = MapperService.mapPiaToSormas(answers);

    if (Object.keys(sormasData).length) {
      await SormasClient.uploadVisit(
        ids,
        questionnaireInstance.dateOfIssue,
        version,
        sormasData
      ).catch(console.error);
    } else {
      console.log(
        'QuestionnaireInstance has no relevant data: ' +
          questionnaireInstance.id.toString()
      );
    }

    try {
      await QuestionnaireAnswersTransmissionService.markQIasTransmitted(
        questionnaireInstance,
        version
      );
      await ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted(
        questionnaireInstance.pseudonym
      );
    } catch (err) {
      console.error(err);
    }
  }

  private static async isAlreadyTransmitted(
    questionnaireInstanceId: number,
    version: ReleaseVersion
  ): Promise<boolean> {
    const symptomTransmissionRepository = getRepository(SymptomTransmission);
    return (
      (await symptomTransmissionRepository.count({
        version,
        questionnaireInstanceId,
      })) > 0
    );
  }

  private static async markQIasTransmitted(
    qi: QuestionnaireInstance,
    version: number
  ): Promise<InsertResult> {
    const symptomTransmissionRepository = getRepository(SymptomTransmission);
    return symptomTransmissionRepository.insert({
      pseudonym: qi.pseudonym,
      questionnaireInstanceId: qi.id,
      study: qi.studyId,
      transmissionDate: new Date(),
      version,
    });
  }
}
