/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pseudonym, StudyName } from '@pia/lib-publicapi';
import {
  FindConditions,
  getConnection,
  getCustomRepository,
  getRepository,
  In,
  Not,
} from 'typeorm';
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
import { CustomName, QuestionnaireType } from '../models/questionnaire';
import {
  PatchQuestionnaireInstanceDto,
  QuestionnaireInstance as QuestionnaireInstanceDeprecated,
  QuestionnaireInstanceStatus,
} from '../models/questionnaireInstance';
import { CustomQuestionnaireInstanceRepository } from '../repositories/questionnaireInstanceRepository';
import { messageQueueService } from './messageQueueService';
import { QuestionnaireFilter } from './questionnaireFilter';
import isInstanceWithNarrowedStatus from '../helpers/isInstanceWithNarrowedStatus';

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

    // delete would fail with a zero length array
    if (instanceIdsToDelete.length === 0) {
      return;
    }

    await getRepository(QuestionnaireInstance).delete(instanceIdsToDelete);
  }

  public static async expireQuestionnaireInstances(
    pseudonym: string,
    status: QuestionnaireInstanceStatus[],
    questionnaireType: QuestionnaireType
  ): Promise<void> {
    const idsToUpdate = (
      await getRepository(QuestionnaireInstance).find({
        relations: ['questionnaire'],
        where: {
          pseudonym,
          status: In<QuestionnaireInstanceStatus>(status),
          questionnaire: {
            type: questionnaireType,
          },
        },
      })
    ).map((instance) => instance.id);

    await getRepository(QuestionnaireInstance).update(idsToUpdate, {
      status: 'expired',
    });
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
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // TypeORM does update the instance object in place, therefore we need to
      // create a detached copy, to be able to check for changes later on.
      const previousInstance = structuredClone(instance);

      const patchedInstance = await this.updateInstance(
        instance,
        dto,
        returnRaw
      );

      // At this point, the instance object has been updated.
      // As updates lead to other fields to change, we use the updated instance object to
      // 1. check if all conditions for sending messages apply
      // 2. use the updated instance as the final payload for the messages to be sent
      await this.sendMessagesOnUpdate(previousInstance, instance);
      await queryRunner.commitTransaction();

      return patchedInstance;
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
  ): Promise<void> {
    const statusesToUpdate: QuestionnaireInstanceStatus[] = [
      'active',
      'in_progress',
    ];

    const status = statusesToUpdate.includes(instance.status)
      ? 'in_progress'
      : null;
    const progress = await this.calculateProgress(instance);

    if (progress != instance.progress) {
      await this.patchInstance(instance, {
        ...(status ? { status } : {}),
        progress,
      });
    }
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

  /**
   * Does check of the instance
   */
  private static async sendMessagesOnUpdate(
    previousInstance: QuestionnaireInstance,
    updatedInstance: QuestionnaireInstance
  ): Promise<void> {
    const isStatusChanging = previousInstance.status !== updatedInstance.status;

    if (
      isStatusChanging &&
      isInstanceWithNarrowedStatus(updatedInstance, ['in_progress'])
    ) {
      await messageQueueService.sendQuestionnaireInstanceAnsweringStarted(
        updatedInstance
      );
    }

    if (
      (isStatusChanging &&
        isInstanceWithNarrowedStatus(updatedInstance, [
          'released',
          'released_once',
          'released_twice',
        ])) ||
      // We also want to send a message on successive releases which are only
      // indicated by an increased release version in combination with status `released`.
      (previousInstance.releaseVersion !== updatedInstance.releaseVersion &&
        isInstanceWithNarrowedStatus(updatedInstance, ['released']))
    ) {
      await messageQueueService.sendQuestionnaireInstanceReleased(
        updatedInstance
      );
    }
  }

  private static async updateInstance(
    instance: QuestionnaireInstance,
    dto: PatchQuestionnaireInstanceDto,
    returnRaw: true
  ): Promise<QuestionnaireInstanceDeprecated>;

  private static async updateInstance(
    instance: QuestionnaireInstance,
    dto: PatchQuestionnaireInstanceDto,
    returnRaw: false
  ): Promise<QuestionnaireInstance>;

  // We need this additional overload because TypeScript cannot narrow the union type of returnRaw
  // when drilling the same argument from the calling function, which also uses overloads.
  private static async updateInstance(
    instance: QuestionnaireInstance,
    dto: PatchQuestionnaireInstanceDto,
    returnRaw: boolean
  ): Promise<QuestionnaireInstance | QuestionnaireInstanceDeprecated>;

  private static async updateInstance(
    instance: QuestionnaireInstance,
    dto: PatchQuestionnaireInstanceDto,
    returnRaw = false
  ): Promise<QuestionnaireInstance | QuestionnaireInstanceDeprecated> {
    this.validateStatusTransition(instance, dto.status);

    const updateResult = await getRepository(QuestionnaireInstance)
      .createQueryBuilder()
      .update(instance)
      .set(this.getFieldsToUpdateForRelease(instance, dto))
      .whereEntity(instance)
      .returning('*')
      .execute();

    if (updateResult.affected === 0) {
      throw new Error(
        `Questionnaire instance with ID "${instance.id}" could not be updated`
      );
    }

    if (
      Array.isArray(updateResult.raw) &&
      updateResult.raw.length === 1 &&
      returnRaw
    ) {
      return updateResult.raw[0] as QuestionnaireInstanceDeprecated;
    }

    return instance;
  }

  private static validateStatusTransition(
    instance: QuestionnaireInstance,
    newStatus: QuestionnaireInstanceStatus | undefined
  ): void {
    if (newStatus && !this.isAllowedStatusTransition(instance, newStatus)) {
      throw new InvalidStatusTransitionError(instance.status, newStatus);
    }
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
}
