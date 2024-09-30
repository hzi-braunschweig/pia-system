/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { getCustomRepository, getRepository, In } from 'typeorm';
import { Answer } from '../../entities/answer';
import { QuestionnaireInstance } from '../../entities/questionnaireInstance';
import { QuestionnaireInstanceStatus } from '../../models/questionnaireInstance';
import { CustomQuestionnaireInstanceRepository } from '../../repositories/questionnaireInstanceRepository';
import { QuestionnaireFilter } from '../../services/questionnaireFilter';
import { CreateQuestionnaireInstanceInternalDto } from '@pia-system/lib-http-clients-internal';
import { messageQueueService } from '../../services/messageQueueService';
import { Questionnaire } from '../../entities/questionnaire';
import { QuestionnaireInstanceQueue } from '../../entities/questionnaireInstanceQueue';
import addMinutes from 'date-fns/addMinutes';
import { QuestionnaireInstanceOrigin } from '../../entities/questionnaireInstanceOrigin';

export class InternalQuestionnaireInstancesInteractor {
  public static async getQuestionnaireInstance(
    id: number,
    filterQuestionnaireByConditions?: boolean
  ): Promise<QuestionnaireInstance> {
    const qiRepo = getCustomRepository(CustomQuestionnaireInstanceRepository);
    const qInstance = await qiRepo
      .findOneOrFailByIdWithQuestionnaire({
        where: {
          id: id,
        },
        relations: [
          'questionnaire.questions.condition.targetAnswerOption',
          'questionnaire.questions.answerOptions.condition.targetAnswerOption',
        ],
      })
      .catch((err) => {
        throw Boom.notFound('Could not get the questionnaire instance', err);
      });
    if (filterQuestionnaireByConditions) {
      await QuestionnaireFilter.filterQuestionnaireOfInstance(qInstance);
    }
    return qInstance;
  }

  public static async getQuestionnaireInstancesForProband(
    pseudonym: string,
    filter: {
      loadQuestionnaire: boolean;
      status: QuestionnaireInstanceStatus[];
    }
  ): Promise<QuestionnaireInstance[]> {
    const qiRepo = getCustomRepository(CustomQuestionnaireInstanceRepository);
    try {
      if (filter.loadQuestionnaire) {
        return await qiRepo.findWithQuestionnaire({
          where: {
            pseudonym: pseudonym,
            status: In(filter.status),
          },
        });
      } else {
        return await qiRepo.find({
          where: {
            pseudonym: pseudonym,
            status: In(filter.status),
          },
        });
      }
    } catch (e) {
      console.error(e);
      throw Boom.boomify(e as Error);
    }
  }

  public static async getQuestionnaireInstanceAnswers(
    questionnaireInstance: number
  ): Promise<Answer[]> {
    const answerRepo = getRepository(Answer);
    return await answerRepo.find({
      where: {
        questionnaireInstance,
      },
      relations: ['answerOption'],
    });
  }

  public static async createQuestionnaireInstances(
    questionnaireInstances: CreateQuestionnaireInstanceInternalDto[]
  ): Promise<CreateQuestionnaireInstanceInternalDto[]> {
    const instanceRepository = getRepository(QuestionnaireInstance);
    const questionnaireRepository = getRepository(Questionnaire);
    const instanceQueueRepository = getRepository(QuestionnaireInstanceQueue);
    const originRepository = getRepository(QuestionnaireInstanceOrigin);

    const instances: QuestionnaireInstance[] = [];

    for (const dto of questionnaireInstances) {
      instances.push(
        instanceRepository.create({
          studyId: dto.studyId,
          pseudonym: dto.pseudonym,
          dateOfIssue: dto.dateOfIssue,
          sortOrder: dto.sortOrder,
          cycle: dto.cycle,
          status: dto.status,
          questionnaireName: dto.questionnaireName,
          questionnaire: {
            id: dto.questionnaireId,
            version: dto.questionnaireVersion,
          },
          origin: dto.origin
            ? originRepository.create({
                originInstance: { id: dto.origin.originInstance },
                condition: { id: dto.origin.condition },
              })
            : undefined,
        })
      );
    }

    // Save new instances and their origin if set
    const result = await instanceRepository.save(instances, { reload: true });

    // add questionnaire instance queue entries
    const instancesMarkedForQueue = questionnaireInstances.filter(
      (qi) => qi.options?.addToQueue
    );
    const instanceQueueEntries = result
      .filter((entity) =>
        instancesMarkedForQueue.some(
          (qi) =>
            entity.pseudonym === qi.pseudonym &&
            entity.questionnaire?.id === qi.questionnaireId &&
            entity.questionnaire.version === qi.questionnaireVersion &&
            entity.cycle === qi.cycle
        )
      )
      .map((entity) => {
        let dateOfQueue = new Date();
        if (
          entity.questionnaireName === 'Nasenabstrich' ||
          entity.questionnaireName === 'Nach Spontanmeldung: Nasenabstrich'
        ) {
          dateOfQueue = addMinutes(new Date(), 1);
        }
        return instanceQueueRepository.create({
          questionnaireInstance: entity,
          pseudonym: entity.pseudonym,
          dateOfQueue,
        });
      });

    await instanceQueueRepository.save(instanceQueueEntries);

    // Fetch and populate custom names for questionnaire instances for publishing messages
    const customNames = new Map<number, string | null>();

    for (const instance of result) {
      if (!instance.questionnaire) {
        continue;
      }

      if (!customNames.has(instance.questionnaire.id)) {
        const questionnaire = await questionnaireRepository.findOneOrFail({
          select: ['id', 'customName'],
          where: {
            id: instance.questionnaire.id,
            version: instance.questionnaire.version,
          },
        });
        customNames.set(instance.questionnaire.id, questionnaire.customName);
      }

      instance.questionnaire.customName =
        customNames.get(instance.questionnaire.id) ?? '';
    }

    // Publish instance created messages
    await Promise.all(
      result.map(async (instance) =>
        messageQueueService.sendQuestionnaireInstanceCreated(instance)
      )
    );

    return result.map((instance) => ({
      id: instance.id,
      studyId: instance.studyId,
      questionnaireId: instance.questionnaire?.id ?? 0,
      questionnaireVersion: instance.questionnaire?.version ?? 0,
      sortOrder: instance.sortOrder,
      questionnaireName: instance.questionnaireName,
      pseudonym: instance.pseudonym,
      dateOfIssue: instance.dateOfIssue,
      cycle: instance.cycle,
      options: {
        addToQueue: instanceQueueEntries.some(
          (iqe) => iqe.questionnaireInstance.id === instance.id
        ),
      },
      status:
        instance.status as unknown as CreateQuestionnaireInstanceInternalDto['status'],
      origin: instance.origin
        ? {
            originInstance: instance.origin.originInstance.id,
            createdInstance: instance.id,
            condition: instance.origin.condition.id,
          }
        : null,
    }));
  }
}
