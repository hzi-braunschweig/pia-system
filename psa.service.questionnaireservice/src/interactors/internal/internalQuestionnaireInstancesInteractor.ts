/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { getRepository, getCustomRepository, In } from 'typeorm';
import { Answer } from '../../entities/answer';
import { QuestionnaireInstance } from '../../entities/questionnaireInstance';
import { QuestionnaireInstanceStatus } from '../../models/questionnaireInstance';
import { CustomQuestionnaireInstanceRepository } from '../../repositories/questionnaireInstanceRepository';

export class InternalQuestionnaireInstancesInteractor {
  public static async getQuestionnaireInstance(
    id: number
  ): Promise<QuestionnaireInstance> {
    const qiRepo = getCustomRepository(CustomQuestionnaireInstanceRepository);
    return await qiRepo
      .findOneOrFailByIdWithQuestionnaire({
        where: {
          id: id,
        },
      })
      .catch((err) => {
        throw Boom.notFound('Could not get the questionnaire instance', err);
      });
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
}
