/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  FindConditions,
  getConnection,
  getCustomRepository,
  getRepository,
  In,
  Not,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Answer } from '../entities/answer';
import {
  hasQuestionnaireRelation,
  HasQuestionnaireRelation,
} from '../entities/questionnaire';
import { QuestionnaireInstance } from '../entities/questionnaireInstance';
import {
  InvalidQuestionnaireCycleUnitError,
  InvalidStatusTransitionError,
  QuestionnaireInstanceNotFoundError,
} from '../errors';
import { StudyName } from '../models/customTypes';
import { Pseudonym } from '../models/pseudonym';
import { CustomName, QuestionnaireType } from '../models/questionnaire';
import {
  PatchQuestionnaireInstanceDto,
  QuestionnaireInstance as QuestionnaireInstanceDeprecated,
  QuestionnaireInstanceStatus,
} from '../models/questionnaireInstance';
import { CustomQuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';
import { messageQueueService } from './messageQueueService';
import { QuestionnaireFilter } from './questionnaireFilter';

export class QuestionnaireInstanceService {
  public static async getQuestionnaireInstances(
    studyName: StudyName,
    pseudonym: Pseudonym,
    customName?: CustomName,
    status?: QuestionnaireInstanceStatus
  ): Promise<HasQuestionnaireRelation<QuestionnaireInstance>[]> {
    const customNameQuery: FindConditions<QuestionnaireInstance> = customName
      ? { questionnaire: { customName } }
      : {};
    const statusQuery: FindConditions<QuestionnaireInstance> = status
      ? { status }
      : {};

    const result = await getRepository(QuestionnaireInstance).find({
      relations: ['questionnaire'],
      where: {
        studyId: studyName,
        pseudonym,
        ...statusQuery,
        ...customNameQuery,
      },
    });

    return result.filter(
      (v): v is HasQuestionnaireRelation<QuestionnaireInstance> =>
        hasQuestionnaireRelation(v)
    );
  }

  public static isAllowedStatusTransitionForProband(
    oldStatus: QuestionnaireInstanceStatus,
    newStatus: QuestionnaireInstanceStatus
  ): boolean {
    switch (oldStatus) {
      case 'active':
        return newStatus === 'in_progress' || newStatus === 'released_once';
      case 'in_progress':
        return newStatus === 'released_once' || newStatus === 'in_progress';
      case 'released_once':
        return newStatus === 'released_twice';
      default:
        return false;
    }
  }

  public static async getQuestionnaireInstance(
    id: number,
    options: {
      excludeStatus?: QuestionnaireInstanceStatus;
      questionnaireType?: QuestionnaireType;
    }
  ): Promise<QuestionnaireInstance> {
    const whereStatusIsNot = options.excludeStatus
      ? { status: Not(options.excludeStatus) }
      : {};
    const whereQuestionnaireType = options.questionnaireType
      ? { questionnaire: { type: options.questionnaireType } }
      : {};

    return await getRepository(QuestionnaireInstance).findOneOrFail(id, {
      relations: ['questionnaire'],
      where: {
        ...whereStatusIsNot,
        ...whereQuestionnaireType,
      },
    });
  }

  public static isAllowedStatusTransitionForResearcher(
    oldStatus: QuestionnaireInstanceStatus,
    newStatus: QuestionnaireInstanceStatus
  ): boolean {
    switch (oldStatus) {
      case 'active':
        return newStatus === 'in_progress' || newStatus === 'released';
      case 'in_progress':
        return newStatus === 'released' || newStatus === 'in_progress';
      case 'released':
        return newStatus === 'released';
      default:
        return false;
    }
  }

  /**
   * Deletes all questionnaire instances of the proband which are inactive
   * and are to be filled out by probands. Those instances are not needed
   * anymore after a proband has been deactivated.
   */
  public static async deleteInactiveForProbandQuestionnaireInstances(
    pseudonym: string
  ): Promise<void> {
    const instanceIdsToDelete = (
      await getRepository(QuestionnaireInstance).find({
        relations: ['questionnaire'],
        where: {
          pseudonym,
          status: 'inactive',
          questionnaire: {
            type: 'for_probands',
          },
        },
      })
    ).map((instance) => instance.id);
    await getRepository(QuestionnaireInstance).delete(instanceIdsToDelete);
  }

  public static async get(id: number): Promise<QuestionnaireInstance>;
  public static async get(
    customName: string,
    studyName: string,
    pseudonym: string
  ): Promise<QuestionnaireInstance>;
  public static async get(
    identifier: CustomName | number,
    studyName?: string,
    pseudonym?: string
  ): Promise<QuestionnaireInstance>;

  public static async get(
    identifier: CustomName | number,
    studyName?: string,
    pseudonym?: string
  ): Promise<QuestionnaireInstance> {
    if (typeof identifier === 'string' && studyName && pseudonym) {
      return this.getByCustomName(studyName, identifier, pseudonym);
    }

    if (typeof identifier === 'number') {
      return this.getById(identifier);
    }

    throw new Error(
      'You need to provide a custom name, study name and pseudonym or an ID'
    );
  }

  public static async getById(
    id: number | CustomName,
    evaluateConditions = false
  ): Promise<QuestionnaireInstance> {
    const result = await getCustomRepository(
      CustomQuestionnaireInstanceRepository
    ).findOneWithAllConditionRelations({ where: { id } });

    if (!result) {
      throw new QuestionnaireInstanceNotFoundError(
        `A questionnaire instance for a questionnaire with id "${id}" does not exist`
      );
    }

    if (!result.questionnaire) {
      throw new Error(
        `The questionnaire instance with ID "${result.id}" is not related to a questionnaire`
      );
    }

    if (evaluateConditions) {
      await QuestionnaireFilter.filterQuestionnaireOfInstance(result);
    }

    return result;
  }

  public static async getByCustomName(
    studyName: string,
    customName: string,
    pseudonym: string
  ): Promise<QuestionnaireInstance> {
    const result = await getCustomRepository(
      CustomQuestionnaireInstanceRepository
    ).findOneWithAllConditionRelations({
      where: {
        pseudonym,
        studyId: studyName,
        questionnaire: { customName },
      },
    });

    if (!result) {
      throw new QuestionnaireInstanceNotFoundError(
        `A questionnaire instance for a questionnaire with the custom name "${customName}" does not exist`
      );
    }

    if (!result.questionnaire) {
      throw new Error(
        `The questionnaire instance with ID "${result.id}" is not related to a questionnaire`
      );
    }

    if (result.questionnaire.cycleUnit !== 'once') {
      throw new InvalidQuestionnaireCycleUnitError(
        'The questionnaire for the selected instance is recurring and does not create a single, unique questionnaire instance.'
      );
    }

    return result;
  }

  public static async patchInstance(
    instance: QuestionnaireInstance,
    dto: PatchQuestionnaireInstanceDto,
    returnRaw?: false
  ): Promise<QuestionnaireInstance>;

  public static async patchInstance(
    instance: QuestionnaireInstance,
    dto: PatchQuestionnaireInstanceDto,
    returnRaw?: true
  ): Promise<QuestionnaireInstanceDeprecated>;

  public static async patchInstance(
    instance: QuestionnaireInstance,
    dto: PatchQuestionnaireInstanceDto,
    returnRaw = false
  ): Promise<QuestionnaireInstanceDeprecated | QuestionnaireInstance> {
    if (dto.status && !this.isAllowedStatusTransition(instance, dto.status)) {
      throw new InvalidStatusTransitionError(instance.status, dto.status);
    }

    let result: QuestionnaireInstance | QuestionnaireInstanceDeprecated;

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const updateResult = await getRepository(QuestionnaireInstance)
        .createQueryBuilder()
        .update(instance)
        .set(this.getFieldsToUpdateForRelease(instance, dto))
        .whereEntity(instance)
        .returning('*')
        .execute();

      const patchedInstance = getRepository(QuestionnaireInstance).create(
        updateResult.generatedMaps
      )[0];

      if (updateResult.affected === 0 || !patchedInstance) {
        throw new Error(
          `Questionnaire instance with ID "${instance.id}" could not be patched`
        );
      }

      await this.sendMessageOnRelease(instance);
      await queryRunner.commitTransaction();

      if (
        returnRaw &&
        Array.isArray(updateResult.raw) &&
        updateResult.raw.length === 1
      ) {
        result = updateResult.raw[0] as QuestionnaireInstanceDeprecated;
      } else {
        result = patchedInstance;
      }

      return result;
    } catch (e: unknown) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  public static isAllowedStatusTransition(
    instance: QuestionnaireInstance,
    newStatus: QuestionnaireInstanceStatus
  ): boolean {
    const type = instance.questionnaire?.type;

    if (type === 'for_probands') {
      return this.isAllowedStatusTransitionForProband(
        instance.status,
        newStatus
      );
    }

    if (type === 'for_research_team') {
      return this.isAllowedStatusTransitionForResearcher(
        instance.status,
        newStatus
      );
    }

    throw Error(
      `Could not determine if status transition to "${newStatus}" is allowed, because the questionnaire type is empty`
    );
  }

  public static async updateProgress(
    instance: QuestionnaireInstance
  ): Promise<QuestionnaireInstanceStatus> {
    const statusesToUpdate: QuestionnaireInstanceStatus[] = [
      'active',
      'in_progress',
    ];

    const status: QueryDeepPartialEntity<QuestionnaireInstance> =
      statusesToUpdate.includes(instance.status)
        ? { status: 'in_progress' }
        : {};

    const result = await getRepository(QuestionnaireInstance).update(instance, {
      ...status,
      progress: await this.calculateProgress(instance),
    });

    if (result.affected === 0) {
      throw new Error(
        `Questionnaire instance with ID "${instance.id}" was not found to update progress and update status`
      );
    }

    return instance.status;
  }

  public static determineReleaseVersion(
    instance: QuestionnaireInstance,
    newStatus: QuestionnaireInstanceStatus
  ): number {
    if (!this.isAllowedStatusTransition(instance, newStatus)) {
      throw new InvalidStatusTransitionError(instance.status, newStatus);
    }

    const questionnaire = instance.questionnaire;
    if (!questionnaire) {
      throw new Error(
        'Cannot not determine release version as the given questionnaire instance was not fetched with its questionnaire'
      );
    }

    let releaseVersion = 0;

    if (questionnaire.type === 'for_probands') {
      if (newStatus === 'released_once') {
        releaseVersion = 1;
      } else if (newStatus === 'released_twice') {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        releaseVersion = 2;
      }
    } else if (
      questionnaire.type === 'for_research_team' &&
      newStatus === 'released'
    ) {
      releaseVersion = (instance.releaseVersion ?? 0) + 1;
    }

    return releaseVersion;
  }

  public static async calculateProgress(
    instance: QuestionnaireInstance
  ): Promise<number> {
    await QuestionnaireFilter.filterQuestionnaireOfInstance(instance);

    const questionIDs = instance.questionnaire?.questions?.map((q) => q.id);

    // If all questions are removed by conditions, all possible answers (none) have been provided.
    // Therefore, the progress is considered to be 100%.
    if (!questionIDs) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      return 100;
    }

    const instanceReleaseVersion = instance.releaseVersion ?? 0;

    // participants cannot change their answers after released_twice release, so there will never be a version 3
    const nextReleaseVersion =
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      instance.status === 'released_twice' ? 2 : instanceReleaseVersion + 1;

    const answers = await getRepository(Answer).find({
      where: {
        questionnaireInstance: instance.id,
        question: In(questionIDs),
        versioning: nextReleaseVersion,
      },
    });

    if (answers.length === 0) {
      return 0;
    }

    const emptyAnswerValues = [null, ''];
    const answersCompletedCount: number = answers.reduce(
      (acc, curr) => (emptyAnswerValues.includes(curr.value) ? acc : acc + 1),
      0
    );

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    return Math.round((answersCompletedCount / answers.length) * 100);
  }

  private static getFieldsToUpdateForRelease(
    instance: Partial<QuestionnaireInstance>,
    dto: PatchQuestionnaireInstanceDto
  ): Partial<QuestionnaireInstance> {
    const updatedFields: Partial<QuestionnaireInstance> = { ...dto };

    switch (dto.status) {
      case 'released_once':
        updatedFields.dateOfReleaseV1 = new Date();
        updatedFields.releaseVersion = 1;
        if (instance.questionnaire?.cycleUnit === 'spontan') {
          updatedFields.dateOfIssue = new Date();
        }
        break;
      case 'released_twice':
        updatedFields.releaseVersion = 2;
        updatedFields.dateOfReleaseV2 = new Date();
        break;
    }

    return updatedFields;
  }

  private static async sendMessageOnRelease(
    instance: Pick<
      QuestionnaireInstance,
      'id' | 'status' | 'releaseVersion' | 'studyId'
    >
  ): Promise<void> {
    const shouldSend = ['released', 'released_once', 'released_twice'].includes(
      instance.status
    );
    if (shouldSend) {
      await messageQueueService.sendQuestionnaireInstanceReleased(
        instance.id,
        instance.releaseVersion ?? 0,
        instance.studyId
      );
    }
  }
}
