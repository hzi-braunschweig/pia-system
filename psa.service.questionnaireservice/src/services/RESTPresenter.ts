/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { sanitizeHtml } from '@pia/lib-service-core';
import { StudyAccess } from '../models/study_access';
import { Questionnaire } from '../models/questionnaire';
import { AnswerType } from '../models/answerType';
import { Study } from '../models/study';
import { StudyWelcomeText } from '../models/studyWelcomeText';
import {
  QuestionnaireInstance,
  QuestionnaireInstanceForPM,
} from '../models/questionnaireInstance';
import { Answer } from '../models/answer';
import { QuestionnaireInstanceQueue } from '../models/questionnaireInstanceQueue';

interface Link {
  href: string;
}

interface LinkBlock {
  [key: string]: Link;

  self: Link;
}

export interface RESTResponse {
  links: LinkBlock;
}

export class RESTPresenter {
  /**
   * Presents a questionnaire object as a REST compliant json object
   * @param questionnaireObj the questionnaires object to present
   * @returns a questionnaire object as a REST compliant json object
   */
  public static presentQuestionnaire(
    questionnaireObj: Questionnaire | null
  ): (RESTResponse & Questionnaire) | null {
    if (questionnaireObj) {
      RESTPresenter.sanitizeQuestions(questionnaireObj);
      return {
        ...questionnaireObj,
        links: RESTPresenter.constructQuestionnaireLinks(
          questionnaireObj.id,
          questionnaireObj.version
        ),
      };
    }
    return null;
  }

  /**
   * Presents an array of questionnaires as a REST compliant json object
   * @param questionnairesArr the questionnaires array to present
   * @returns a questionnaires object as a REST compliant json object
   */
  public static presentQuestionnaires(
    questionnairesArr: Questionnaire[]
  ): RESTResponse & { questionnaires: Questionnaire[] } {
    questionnairesArr.forEach(function (questionnaire) {
      RESTPresenter.sanitizeQuestions(questionnaire);
    });
    return {
      questionnaires: questionnairesArr,
      links: RESTPresenter.constructQuestionnairesLinks(),
    };
  }

  /**
   * Presents a answertype object as a REST compliant json object
   * @param answertypeObj the answertype object to present
   * @returns a answertype object as a REST compliant json object
   */
  public static presentAnswertype(
    answertypeObj: AnswerType | null
  ): (RESTResponse & AnswerType) | null {
    if (answertypeObj) {
      return {
        ...answertypeObj,
        links: RESTPresenter.constructAnswertypeLinks(answertypeObj.id),
      };
    }
    return null;
  }

  /**
   * Presents an array of answertypes as a REST compliant json object
   * @param answertypesArr the answertype array to present
   * @returns a answertypes object as a REST compliant json object
   */
  public static presentAnswertypes(
    answertypesArr: AnswerType[]
  ): RESTResponse & { answertypes: AnswerType[] } {
    return {
      answertypes: answertypesArr,
      links: RESTPresenter.constructAnswertypesLinks(),
    };
  }

  /**
   * Presents a study object as a REST compliant json object
   * @param studyObj the study to present
   * @returns a study object as a REST compliant json object
   */
  public static presentStudy(
    studyObj: (Partial<Study> & { name: string }) | null
  ): (RESTResponse & Partial<Study>) | null {
    if (studyObj) {
      return {
        ...studyObj,
        links: RESTPresenter.constructStudyLinks(studyObj.name),
      };
    }
    return null;
  }

  /**
   * Presents a study welcome text object as a REST compliant json object
   * @param studyWelcomeTextObj the study welcome text object to present
   * @returns a study welcome text object as a REST compliant json object
   */
  public static presentStudyWelcomeText(
    studyWelcomeTextObj: StudyWelcomeText | null
  ): StudyWelcomeText | null {
    if (studyWelcomeTextObj) {
      studyWelcomeTextObj.welcome_text = sanitizeHtml(
        studyWelcomeTextObj.welcome_text
      );
      return studyWelcomeTextObj;
    }
    return null;
  }

  /**
   * Presents an array of studies as a REST compliant json object
   * @param studiesArr the studies array to present
   * @returns a studies object as a REST compliant json object
   */
  public static presentStudies(
    studiesArr: Partial<Study>[]
  ): RESTResponse & { studies: Partial<Study>[] } {
    return {
      studies: studiesArr,
      links: RESTPresenter.constructStudiesLinks(),
    };
  }

  /**
   * Presents a study access object as a REST compliant json object
   * @param accessObj the study access object to present
   * @returns a study access object as a REST compliant json object
   */
  public static presentStudyAccess(
    accessObj: StudyAccess | null
  ): (RESTResponse & StudyAccess) | null {
    if (accessObj) {
      return {
        ...accessObj,
        links: RESTPresenter.constructStudyAccessLinks(accessObj),
      };
    }
    return null;
  }

  /**
   * Presents an array of study accesses as a REST compliant json object
   * @param accessesArr the study accesses array to present
   * @param studyId the study id of the accesses array
   * @returns a study accesses object as a REST compliant json object
   */
  public static presentStudyAccesses(
    accessesArr: StudyAccess[],
    studyId: string
  ): (RESTResponse & { study_accesses: StudyAccess[] }) | null {
    return {
      study_accesses: accessesArr,
      links: RESTPresenter.constructStudyAccessesLinks(studyId),
    };
  }

  /**
   * presents a questionnaire instance object as a REST compliant json object
   * @param qInstanceObj the questionnaire instance object to present
   * @returns a questionnaire instance object as a REST compliant json object
   */
  public static presentQuestionnaireInstance(
    qInstanceObj: QuestionnaireInstance | QuestionnaireInstanceForPM | null
  ):
    | (RESTResponse & (QuestionnaireInstance | QuestionnaireInstanceForPM))
    | null {
    if (qInstanceObj) {
      if (
        qInstanceObj.questionnaire &&
        Array.isArray((qInstanceObj.questionnaire as Questionnaire).questions)
      ) {
        RESTPresenter.sanitizeQuestions(
          qInstanceObj.questionnaire as Questionnaire
        );
      }
      return {
        ...qInstanceObj,
        links: RESTPresenter.constructQuestionnaireInstanceLinks(
          qInstanceObj.id
        ),
      };
    }
    return null;
  }

  /**
   * presents an array of questionnaire instances as a REST compliant json object
   * @param questionnaireInstancesArr the questionnaire instances array to present
   * @returns a questionnaire instances object as a REST compliant json object
   */
  public static presentQuestionnaireInstances(
    questionnaireInstancesArr:
      | QuestionnaireInstance[]
      | QuestionnaireInstanceForPM[]
  ): RESTResponse & {
    questionnaireInstances:
      | QuestionnaireInstance[]
      | QuestionnaireInstanceForPM[];
  } {
    questionnaireInstancesArr.forEach(function (qInstance) {
      if (
        qInstance.questionnaire &&
        Array.isArray((qInstance.questionnaire as Questionnaire).questions)
      ) {
        RESTPresenter.sanitizeQuestions(
          qInstance.questionnaire as Questionnaire
        );
      }
    });

    return {
      questionnaireInstances: questionnaireInstancesArr,
      links: RESTPresenter.constructQuestionnaireInstancesLinks(),
    };
  }

  /**
   * presents an array of answers as a REST compliant json object
   * @param answersArr the answers array to present
   * @param qInstanceId the id of the questionnaire instance
   * @returns a answers object as a REST compliant json object
   */
  public static presentAnswers(
    answersArr: Answer[],
    qInstanceId: number
  ): RESTResponse & { answers: Answer[] } {
    return {
      answers: answersArr,
      links: RESTPresenter.constructAnswersLinks(qInstanceId),
    };
  }

  /**
   * presents an array of queues as a REST compliant json object
   * @param queuesArr the queues array to present
   * @param username the requesting users name
   * @returns a answers object as a REST compliant json object
   */
  public static presentAllQueues(
    queuesArr: QuestionnaireInstanceQueue[],
    username: string
  ): RESTResponse & { queues: QuestionnaireInstanceQueue[] } {
    return {
      queues: queuesArr,
      links: RESTPresenter.constructAllQueuesLinks(username),
    };
  }

  /**
   * presents a study queue object as a REST compliant json object
   * @param queueObj the queue object to present
   * @returns a queue object as a REST compliant json object
   */
  public static presentQueue(
    queueObj: QuestionnaireInstanceQueue | null
  ): (RESTResponse & QuestionnaireInstanceQueue) | null {
    if (queueObj) {
      return {
        ...queueObj,
        links: RESTPresenter.constructQueueLinks(
          queueObj.user_id,
          queueObj.questionnaire_instance_id
        ),
      };
    }
    return null;
  }

  private static constructQuestionnaireLinks(
    id: number,
    version: number
  ): LinkBlock {
    return {
      self: {
        href: '/questionnaires/' + id.toString() + '/' + version.toString(),
      },
    };
  }

  private static constructQuestionnairesLinks(): LinkBlock {
    return {
      self: { href: '/questionnaires' },
    };
  }

  private static constructAnswertypeLinks(id: number): LinkBlock {
    return {
      self: { href: '/answertypes/' + id.toString() },
    };
  }

  private static constructAnswertypesLinks(): LinkBlock {
    return {
      self: { href: '/answertypes' },
    };
  }

  private static constructStudyLinks(studyId: string): LinkBlock {
    return {
      self: { href: '/studies/' + studyId },
    };
  }

  private static constructStudiesLinks(): LinkBlock {
    return {
      self: { href: '/studies' },
    };
  }

  private static constructStudyAccessLinks(access: StudyAccess): LinkBlock {
    return {
      self: {
        href: '/studies/' + access.study_id + '/accesses/' + access.user_id,
      },
    };
  }

  private static constructStudyAccessesLinks(studyId: string): LinkBlock {
    return {
      self: { href: '/studies/' + studyId + '/accesses' },
    };
  }

  private static constructQuestionnaireInstanceLinks(id: number): LinkBlock {
    return {
      self: { href: '/questionnaireInstances/' + id.toString() },
      answers: {
        href: '/questionnaireInstances/' + id.toString() + '/answers',
      },
    };
  }

  private static constructQuestionnaireInstancesLinks(): LinkBlock {
    return {
      self: { href: '/questionnaireInstances' },
    };
  }

  private static constructAnswersLinks(qInstanceId: number): LinkBlock {
    return {
      self: {
        href: '/questionnaireInstances/' + qInstanceId.toString() + '/answers',
      },
    };
  }

  private static constructAllQueuesLinks(username: string): LinkBlock {
    return {
      self: { href: '/probands/' + username + '/queues' },
    };
  }

  private static constructQueueLinks(
    user_id: string,
    instance_id: number
  ): LinkBlock {
    return {
      self: {
        href: '/probands/' + user_id + '/queues/' + instance_id.toString(),
      },
    };
  }

  private static sanitizeQuestions(qObj: Questionnaire): void {
    qObj.questions.forEach(function (question) {
      question.text = sanitizeHtml(question.text);
    });
  }
}
