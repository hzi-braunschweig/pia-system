/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import pg, { ITask } from 'pg-promise';

import {
  Questionnaire,
  QuestionnaireWithConditionType,
} from '../models/questionnaire';
import { QuestionnaireInstancesService } from './questionnaireInstancesService';
import {
  QuestionnaireInstance,
  QuestionnaireInstanceNew,
  QuestionnaireInstanceQuestionnairePair,
} from '../models/questionnaireInstance';
import { db } from '../db';
import { Answer } from '../models/answer';
import { Proband } from '../models/proband';
import { addMinutes, startOfToday } from 'date-fns';
import { Condition } from '../models/condition';
import { AnswerOption } from '../models/answerOption';
import { asyncForEach } from '@pia/lib-service-core';
import { LoggingService } from './loggingService';
import { ProbandsRepository } from '../repositories/probandsRepository';
import { messageQueueService } from './messageQueueService';

const pgp = pg();

interface QuestionnaireInstanceQueue {
  user_id: string;
  questionnaire_instance_id: number;
  date_of_queue: Date;
}

/**
 * @description handler methods that handle db notifications
 */
export class NotificationHandlers {
  private static readonly logger = new LoggingService('NotificationHandlers');

  private static readonly csQuestionnaireInstances = new pgp.helpers.ColumnSet(
    [
      'study_id',
      'sort_order',
      'questionnaire_id',
      'questionnaire_version',
      'questionnaire_name',
      'user_id',
      'date_of_issue',
      'cycle',
      'status',
    ],
    { table: 'questionnaire_instances' }
  );
  private static readonly csQuestionnaireInstancesQueued =
    new pgp.helpers.ColumnSet(
      ['user_id', 'questionnaire_instance_id', 'date_of_queue'],
      { table: 'questionnaire_instances_queued' }
    );

  private static readonly ONE_ANSWER_VERSION_LENGTH = 1;
  private static readonly TWO_ANSWER_VERSIONS_LENGTH = 2;

  /**
   * Creates questionnaire instances based on the inserted questionnaire
   *
   * @param {Object} questionnaire the inserted questionnaire
   */
  public static async handleInsertedQuestionnaire(
    questionnaire: Questionnaire
  ): Promise<void> {
    await db.tx(async function (t) {
      // Delete old qIs but keep those with answers
      if (questionnaire.version > 1) {
        if (
          questionnaire.cycle_unit === 'spontan' ||
          questionnaire.cycle_unit === 'once'
        ) {
          await t.manyOrNone(
            "DELETE FROM notification_schedules WHERE notification_type='qReminder' AND reference_id::integer=ANY(SELECT id FROM questionnaire_instances WHERE questionnaire_id=$(id) and questionnaire_version < $(version) AND status IN ('active', 'inactive', 'expired'))",
            questionnaire
          );
          const deletedQIs = await t.manyOrNone(
            "DELETE FROM questionnaire_instances WHERE questionnaire_id=$(id) AND questionnaire_version < $(version) AND status IN ('active','inactive') AND NOT EXISTS (SELECT 1 FROM answers WHERE questionnaire_instance_id = questionnaire_instances.id) RETURNING id",
            questionnaire
          );
          NotificationHandlers.logger.info(
            `Deleted ${
              deletedQIs.length
            } QIs from DB before inserting new Questionnaire version: ${NotificationHandlers.logger.printQuestionnaire(
              questionnaire
            )}`
          );
        } else {
          NotificationHandlers.logger.warn(
            `Versioning of ${
              questionnaire.cycle_unit
            } does currently not support deletion of questionnaireInstances. Affected questionnaire: ${NotificationHandlers.logger.printQuestionnaire(
              questionnaire
            )}`
          );
        }
      }

      if (questionnaire.publish === 'hidden') {
        return;
      }

      // Add new instances
      let probands: Proband[];
      if (questionnaire.cycle_unit === 'once') {
        /**
         * if questionnaire is a new version of a one time questionnaire we do not need to create a new instance
         * for probands who already answered one (those instances survived above)
         */
        probands = await NotificationHandlers.getProbandsOfStudy(
          t,
          questionnaire.study_id,
          questionnaire.id
        );
      } else {
        /**
         * other questionnaires need to be created anyway (like spontaneous ones need
         * to replace the active one that was deleted above)
         */
        probands = await NotificationHandlers.getProbandsOfStudy(
          t,
          questionnaire.study_id
        );
      }

      await NotificationHandlers.createQuestionnaireInstancesForProbands(
        questionnaire,
        probands,
        t
      );
    });
  }

  /**
   * Updates questionnaire instances based on the updated questionnaire
   *
   * @param {Object} q_old the old questionnaire
   * @param {Object} q_new the updated questionnaire
   */
  public static async handleUpdatedQuestionnaire(
    q_old: Questionnaire,
    q_new: Questionnaire
  ): Promise<void> {
    if (
      // Do nothing if a questionnaire is deactivated
      // inactive and active questionnaire_instances are already deleted by questionnaireservice
      NotificationHandlers.isDeactivationChange(q_old, q_new) ||
      // Do nothing if a questionnaire had no custom name set and a generated custom name has been set.
      // This happens because we need the questionnaires ID, as it is part of a generated custom name.
      NotificationHandlers.isOverwritingEmptyCustomName(q_old, q_new)
    ) {
      return;
    }
    await db.tx(async function (t) {
      // Delete all old qIs
      await t.manyOrNone(
        'DELETE FROM notification_schedules WHERE notification_type=$1 AND reference_id::integer=ANY(SELECT id FROM questionnaire_instances WHERE questionnaire_id=$2 and questionnaire_version=$3)',
        ['qReminder', q_old.id, q_old.version]
      );
      const deletedQIs = await t.manyOrNone(
        'DELETE FROM questionnaire_instances WHERE questionnaire_id=$(qId) AND questionnaire_version=$(qVersion) RETURNING id',
        {
          qId: q_old.id,
          qVersion: q_old.version,
        }
      );
      NotificationHandlers.logger.info(
        `Deleted ${
          deletedQIs.length
        } QIs from DB before updating Questionnaire ${NotificationHandlers.logger.printQuestionnaire(
          q_new
        )}`
      );

      if (q_new.publish === 'hidden') {
        return;
      }

      const probands: Proband[] = await NotificationHandlers.getProbandsOfStudy(
        t,
        q_new.study_id
      );

      await NotificationHandlers.createQuestionnaireInstancesForProbands(
        q_new,
        probands,
        t
      );
    });
  }

  /**
   * Creates questionnaire instances when a user logs in for the first time
   */
  public static async handleLoginOfProband(pseudonym: string): Promise<void> {
    let proband: Proband = await ProbandsRepository.findOneOrFail(pseudonym);

    if (!NotificationHandlers.isFirstLogin(proband)) {
      // if proband already logged in before, no questionnaire instances need to be created
      return;
    }

    proband = await ProbandsRepository.updateFirstLoggedInAt(
      pseudonym,
      new Date()
    );

    if (!NotificationHandlers.isUserActiveInStudy(proband)) {
      return;
    }
    await NotificationHandlers.createQuestionnaireInstancesForUser(
      proband,
      true
    );
  }

  /**
   * Creates questionnaire instances based on the inserted user
   */
  public static async handleProbandCreated(pseudonym: string): Promise<void> {
    const user: Proband = await ProbandsRepository.findOneOrFail(pseudonym);

    if (!NotificationHandlers.isUserActiveInStudy(user)) {
      return;
    }
    await NotificationHandlers.createQuestionnaireInstancesForUser(user);
  }

  /**
   * Deletes questionnaire instances based on the deleted user
   */
  public static async handleProbandDeleted(pseudonym: string): Promise<void> {
    const deletedQIs = await db.manyOrNone(
      'DELETE FROM questionnaire_instances WHERE user_id=$1 RETURNING *',
      [pseudonym]
    );
    NotificationHandlers.logger.info(
      `Deleted ${deletedQIs.length} questionnaire instances for proband ${pseudonym} because he/she was removed`
    );
  }

  /**
   * Checks updated questionnaire instance and might create or delete questionnaire instances based on connected conditional questionnaire
   */
  public static async handleUpdatedInstance(
    instance_old: QuestionnaireInstance,
    instance_new: QuestionnaireInstance
  ): Promise<void> {
    // Only handle update if an instance was released
    if (
      (instance_new.status !== 'released_once' &&
        instance_new.status !== 'released_twice' &&
        instance_new.status !== 'released') ||
      (instance_old.status === instance_new.status &&
        instance_old.release_version === instance_new.release_version)
    ) {
      return;
    }

    let answerVersion = 1;
    if (instance_new.status === 'released_twice') {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      answerVersion = 2;
    } else if (instance_new.status === 'released') {
      answerVersion = instance_new.release_version;
    }

    await db.tx(async function (t) {
      const qInstancesToAdd: QuestionnaireInstanceQuestionnairePair<QuestionnaireInstanceNew>[] =
        [];
      const activeQInstancesFromExternalConditionsToBeQueued: QuestionnaireInstanceNew[] =
        [];

      const questionnaireOfInstance: Questionnaire = await t.one(
        'SELECT * FROM questionnaires WHERE id=$1 AND version=$2',
        [instance_new.questionnaire_id, instance_new.questionnaire_version]
      );
      const answersWithConditionOfOtherQuestionnaires: (Answer & Condition)[] =
        await t.manyOrNone(
          // select only the newest versions of all questionnaires
          `SELECT value,
                  answer_option_id,
                  questionnaire_instance_id,
                  condition_questionnaire_id,
                  condition_questionnaire_version,
                  condition_type,
                  condition_value,
                  condition_link,
                  condition_operand
           FROM answers AS a
                  JOIN conditions AS c ON
             a.answer_option_id = c.condition_target_answer_option
                  JOIN (SELECT id,
                               MAX(version) AS version
                        FROM questionnaires
                        GROUP BY id) AS q ON
               c.condition_questionnaire_id = q.id
               AND c.condition_questionnaire_version = q.version
           WHERE a.questionnaire_instance_id = $(questionnaireInstanceId)
             AND a.versioning = $(answerVersion)`,
          {
            questionnaireInstanceId: instance_new.id,
            answerVersion: answerVersion,
          }
        );

      // Create next instance for Spontan FB
      if (
        instance_new.status === 'released_once' &&
        questionnaireOfInstance.cycle_unit === 'spontan'
      ) {
        qInstancesToAdd.push({
          questionnaire: questionnaireOfInstance,
          questionnaireInstance:
            QuestionnaireInstancesService.createNextQuestionnaireInstance(
              questionnaireOfInstance,
              instance_new
            ),
        });
      } else if (answersWithConditionOfOtherQuestionnaires.length < 1) {
        // No conditions to check, stop here
        return;
      }

      NotificationHandlers.logger.info(
        'searching for proband with pseudonym ' + instance_new.user_id
      );

      const user: Proband = await ProbandsRepository.findOneOrFail(
        instance_new.user_id,
        { transaction: t }
      );

      NotificationHandlers.logger.info(
        'found proband with pseudonym ' + instance_new.user_id
      );

      // Do not create new instances for deleted probands
      if (NotificationHandlers.isUserDeleted(user)) {
        return;
      }

      // this will have an effect on the start date of questionnaire instances which
      // will be created later on (@see questionnaireInstancesService#createQuestionnaireInstances)
      user.first_logged_in_at = startOfToday();

      await asyncForEach(
        answersWithConditionOfOtherQuestionnaires,
        async function (answerWithCondition) {
          const questionnaire: Questionnaire = await t.one(
            'SELECT * FROM questionnaires WHERE id=$1 AND version=$2',
            [
              answerWithCondition.condition_questionnaire_id,
              answerWithCondition.condition_questionnaire_version,
            ]
          );

          // Do not create instances if referenced questionnaire needs compliance and user did not comply
          if (!user.compliance_samples && questionnaire.compliance_needed) {
            return;
          }
          // Do not create instances to be filled out by probands for deactivated probands
          if (
            !NotificationHandlers.isUserActiveInStudy(user) &&
            questionnaire.type === 'for_probands'
          ) {
            return;
          }
          // Do not create instances for hidden questionnaires
          if (questionnaire.publish === 'hidden') {
            return;
          }
          // Do not create instances for test probands if proband is not a test proband
          if (
            questionnaire.publish === 'testprobands' &&
            !user.is_test_proband
          ) {
            return;
          }
          // Do not create instances for inactive questionnaires
          if (!questionnaire.active) {
            return;
          }

          const conditionTargetAnswerOption: AnswerOption = await t.one(
            'SELECT * FROM answer_options WHERE id=$1',
            [answerWithCondition.answer_option_id]
          );

          // Create instances for referenced questionnaires in external conditions
          if (answerWithCondition.condition_type === 'external') {
            // Questionnaire was answered the first time, just check condition and add instance for referenced questionnaire
            if (
              answerVersion === 1 &&
              QuestionnaireInstancesService.isConditionMet(
                answerWithCondition,
                answerWithCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              const newInstances =
                QuestionnaireInstancesService.createQuestionnaireInstances(
                  questionnaire,
                  user,
                  false
                );
              qInstancesToAdd.push(
                ...QuestionnaireInstancesService.pairQuestionnaireInstancesWithQuestionnaire(
                  newInstances,
                  questionnaire
                )
              );
              if (questionnaire.type === 'for_probands') {
                newInstances.forEach(function (newInstance) {
                  if (newInstance.status === 'active') {
                    activeQInstancesFromExternalConditionsToBeQueued.push(
                      newInstance
                    );
                  }
                });
              }
            }
            // Questionnaire was answered before, if condition is met now and was not before: add instance for referenced questionnaire
            else if (
              answerVersion > 1 &&
              QuestionnaireInstancesService.isConditionMet(
                answerWithCondition,
                answerWithCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              const oldAnswer: Answer | null = await t.oneOrNone(
                'SELECT * FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2 AND versioning=$3',
                [
                  answerWithCondition.questionnaire_instance_id,
                  answerWithCondition.answer_option_id,
                  answerVersion - 1,
                ]
              );
              if (
                !oldAnswer ||
                !QuestionnaireInstancesService.isConditionMet(
                  oldAnswer,
                  answerWithCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                const newInstances =
                  QuestionnaireInstancesService.createQuestionnaireInstances(
                    questionnaire,
                    user,
                    false
                  );
                qInstancesToAdd.push(
                  ...QuestionnaireInstancesService.pairQuestionnaireInstancesWithQuestionnaire(
                    newInstances,
                    questionnaire
                  )
                );
                if (questionnaire.type === 'for_probands') {
                  newInstances.forEach(function (newInstance) {
                    if (newInstance.status === 'active') {
                      activeQInstancesFromExternalConditionsToBeQueued.push(
                        newInstance
                      );
                    }
                  });
                }
              }
            }
            // Questionnaire was answered before, if condition is not met now but was before: remove unanswered old instance for referenced questionnaire
            else if (
              answerVersion > 1 &&
              !QuestionnaireInstancesService.isConditionMet(
                answerWithCondition,
                answerWithCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              const oldAnswer: Answer | null = await t.oneOrNone(
                'SELECT * FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2 AND versioning=$3',
                [
                  answerWithCondition.questionnaire_instance_id,
                  answerWithCondition.answer_option_id,
                  answerVersion - 1,
                ]
              );
              if (
                oldAnswer &&
                QuestionnaireInstancesService.isConditionMet(
                  oldAnswer,
                  answerWithCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                const result = await t.manyOrNone(
                  'DELETE FROM questionnaire_instances WHERE questionnaire_id=$1 AND questionnaire_version=$2 AND id NOT IN ' +
                    '(SELECT questionnaire_instance_id FROM answers WHERE questionnaire_instance_id IN ' +
                    '(SELECT id FROM questionnaire_instances WHERE questionnaire_id=$1 AND questionnaire_version=$2) ) RETURNING *',
                  [questionnaire.id, questionnaire.version]
                );
                NotificationHandlers.logger.info(
                  `Deleted ${
                    result.length
                  } questionnaire instances for questionnaire ${NotificationHandlers.logger.printQuestionnaire(
                    questionnaire
                  )} whos condition was met before but is not met anymore`
                );
              }
            }
          }
          // Create next instance for now met internal_last conditions
          else if (answerWithCondition.condition_type === 'internal_last') {
            if (
              answerVersion === 1 &&
              QuestionnaireInstancesService.isConditionMet(
                answerWithCondition,
                answerWithCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              qInstancesToAdd.push({
                questionnaire,
                questionnaireInstance:
                  QuestionnaireInstancesService.createNextQuestionnaireInstance(
                    questionnaire,
                    instance_new
                  ),
              });
            } else if (
              // eslint-disable-next-line @typescript-eslint/no-magic-numbers
              answerVersion === 2 &&
              QuestionnaireInstancesService.isConditionMet(
                answerWithCondition,
                answerWithCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              const oldAnswer: Answer | null = await t.oneOrNone(
                'SELECT * FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2 AND versioning=$3',
                [
                  answerWithCondition.questionnaire_instance_id,
                  answerWithCondition.answer_option_id,
                  1,
                ]
              );
              if (
                !oldAnswer ||
                !QuestionnaireInstancesService.isConditionMet(
                  oldAnswer,
                  answerWithCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                qInstancesToAdd.push({
                  questionnaire,
                  questionnaireInstance:
                    QuestionnaireInstancesService.createNextQuestionnaireInstance(
                      questionnaire,
                      instance_new
                    ),
                });
              }
            }
          }
        }
      );

      // Insert questionnaire instances
      if (qInstancesToAdd.length > 0) {
        const insertedInstances =
          await NotificationHandlers.createQuestionnaireInstances(
            t,
            qInstancesToAdd
          );

        NotificationHandlers.logger.info(
          `Added ${insertedInstances.length} questionnaire instances to db for conditional questionnaires for user: ${instance_new.user_id}`
        );
        const instancesForQueue = insertedInstances.filter(
          (insertedInstance) => {
            return activeQInstancesFromExternalConditionsToBeQueued.some(
              (markedInstance) => {
                return (
                  insertedInstance.user_id === markedInstance.user_id &&
                  insertedInstance.questionnaire_id ===
                    markedInstance.questionnaire_id &&
                  insertedInstance.questionnaire_version ===
                    markedInstance.questionnaire_version &&
                  insertedInstance.cycle === markedInstance.cycle
                );
              }
            );
          }
        );
        if (instancesForQueue.length > 0) {
          const queuesToInsert: QuestionnaireInstanceQueue[] = [];
          instancesForQueue.forEach((instance) => {
            let date_of_queue = new Date();
            if (
              instance.questionnaire_name === 'Nasenabstrich' ||
              instance.questionnaire_name ===
                'Nach Spontanmeldung: Nasenabstrich'
            ) {
              date_of_queue = addMinutes(new Date(), 1);
            }
            queuesToInsert.push({
              user_id: instance.user_id,
              questionnaire_instance_id: instance.id,
              date_of_queue: date_of_queue,
            });
          });
          const qQuestionnaireInstancesQueued =
            pgp.helpers.insert(
              queuesToInsert,
              NotificationHandlers.csQuestionnaireInstancesQueued
            ) + 'RETURNING *';
          const insertedQueues = await t.manyOrNone(
            qQuestionnaireInstancesQueued
          );
          NotificationHandlers.logger.info(
            `Added ${insertedQueues.length} instance queues to db for external conditioned instances for user: ${instance_new.user_id}`
          );
        }
      }
    });
  }

  private static async getProbandsOfStudy(
    t: ITask<unknown>,
    study: string,
    excludeQuestionnaireId?: number
  ): Promise<Proband[]> {
    const filterByQuestionnaireIdQuery = excludeQuestionnaireId
      ? 'AND pseudonym NOT IN (SELECT user_id FROM questionnaire_instances WHERE questionnaire_id = $(id))'
      : '';

    return t.manyOrNone<Proband>(
      `SELECT pseudonym,
                first_logged_in_at,
                study,
                status,
                ids,
                needs_material,
                study_center,
                examination_wave,
                is_test_proband,
                compliance_labresults,
                compliance_samples,
                compliance_bloodsamples
         FROM probands
         WHERE study = $(study)
           AND status IN ('active', 'deactivated')
           ${filterByQuestionnaireIdQuery}`,
      {
        study,
        id: excludeQuestionnaireId,
      }
    );
  }

  private static async createQuestionnaireInstancesForProbands(
    questionnaire: Questionnaire,
    probands: Proband[],
    t: ITask<unknown>
  ): Promise<void> {
    const qCondition: Condition | null = await t.oneOrNone(
      'SELECT * FROM conditions WHERE condition_questionnaire_id=$(id) AND condition_questionnaire_version=$(version)',
      {
        id: questionnaire.id,
        version: questionnaire.version,
      }
    );

    if (probands.length > 0) {
      const qInstances: QuestionnaireInstanceQuestionnairePair<QuestionnaireInstanceNew>[] =
        [];
      await asyncForEach(probands, async (proband) => {
        if (!proband.compliance_samples && questionnaire.compliance_needed) {
          return;
        }

        if (
          questionnaire.publish === 'testprobands' &&
          !proband.is_test_proband
        ) {
          return;
        }

        // Do not create instances to be filled out by probands for deactivated probands
        // Questionnaires for study assistant should still be created
        if (
          !NotificationHandlers.isUserActiveInStudy(proband) &&
          questionnaire.type === 'for_probands'
        ) {
          return;
        }

        if (
          qCondition &&
          NotificationHandlers.hasExternalCondition(qCondition)
        ) {
          const conditionTargetAnswerOption: AnswerOption = await t.one(
            'SELECT * FROM answer_options WHERE id=$1',
            [qCondition.condition_target_answer_option]
          );
          const conditionTargetAnswer: (Answer & QuestionnaireInstance)[] =
            await t.manyOrNone(
              'SELECT * FROM answers,questionnaire_instances WHERE answers.questionnaire_instance_id=questionnaire_instances.id AND user_id=$1 AND answer_option_id=$2 AND cycle=ANY(SELECT MAX(cycle) FROM questionnaire_instances WHERE user_id=$1 AND questionnaire_id=$3 AND questionnaire_version=$4 AND (questionnaire_instances.status IN ($5, $6, $7))) ORDER BY versioning',
              [
                proband.pseudonym,
                qCondition.condition_target_answer_option,
                qCondition.condition_target_questionnaire,
                qCondition.condition_target_questionnaire_version,
                'released_once',
                'released_twice',
                'released',
              ]
            );
          if (questionnaire.type === 'for_research_team') {
            // Don't care about first_logged_in_at. It's not regarded in createQuestionnaireInstances
            // or getDatesForQuestionnaireInstances for research team questionnaires. The only
            // important thing is, we must continue execution as long as the condition is met.
            if (!conditionTargetAnswer.length) {
              return;
            }
            if (
              !conditionTargetAnswer[conditionTargetAnswer.length - 1] ||
              !QuestionnaireInstancesService.isConditionMet(
                conditionTargetAnswer[conditionTargetAnswer.length - 1],
                qCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              return;
            }
          } else if (
            conditionTargetAnswer.length ===
            NotificationHandlers.TWO_ANSWER_VERSIONS_LENGTH
          ) {
            if (
              conditionTargetAnswer[1]?.date_of_release_v2 &&
              QuestionnaireInstancesService.isConditionMet(
                conditionTargetAnswer[1],
                qCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              // this will have an effect on the start date of questionnaire instances which
              // will be created later on (@see questionnaireInstancesService#createQuestionnaireInstances)
              proband.first_logged_in_at = new Date(
                conditionTargetAnswer[1].date_of_release_v2.setHours(0, 0, 0, 0)
              );
            } else {
              return;
            }
          } else if (
            conditionTargetAnswer.length ===
            NotificationHandlers.ONE_ANSWER_VERSION_LENGTH
          ) {
            if (
              conditionTargetAnswer[0]?.date_of_release_v1 &&
              QuestionnaireInstancesService.isConditionMet(
                conditionTargetAnswer[0],
                qCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              // this will have an effect on the start date of questionnaire instances which
              // will be created later on (@see questionnaireInstancesService#createQuestionnaireInstances)
              proband.first_logged_in_at = new Date(
                conditionTargetAnswer[0].date_of_release_v1.setHours(0, 0, 0, 0)
              );
            } else {
              return;
            }
          } else {
            return;
          }
        }

        qInstances.push(
          ...QuestionnaireInstancesService.pairQuestionnaireInstancesWithQuestionnaire(
            QuestionnaireInstancesService.createQuestionnaireInstances(
              questionnaire,
              proband,
              NotificationHandlers.hasInternalCondition(qCondition)
            ),
            questionnaire
          )
        );
      });

      await NotificationHandlers.createQuestionnaireInstances(t, qInstances);
      NotificationHandlers.logger.info(
        `Added ${
          qInstances.length
        } questionnaire instances to db for inserted questionnaire: ${NotificationHandlers.logger.printQuestionnaire(
          questionnaire
        )}`
      );
    }
  }

  private static async createQuestionnaireInstancesForUser(
    user: Proband,
    onlyLoginDependantOnes = false
  ): Promise<void> {
    await db.tx(async function (t) {
      // Retrieve questionnaires with the newest version only
      const questionnaires: QuestionnaireWithConditionType[] =
        await t.manyOrNone(
          `SELECT questionnaires.*, conditions.condition_type
             FROM questionnaires
                      LEFT JOIN conditions ON questionnaires.id = conditions.condition_questionnaire_id
                 AND questionnaires.version = conditions.condition_questionnaire_version
             WHERE study_id = (SELECT study FROM probands WHERE pseudonym = $(pseudonym))
               AND version = (SELECT MAX(q.version) FROM questionnaires AS q WHERE q.id = questionnaires.id)
               AND active = TRUE`,
          { pseudonym: user.pseudonym }
        );

      if (questionnaires.length <= 0) {
        return;
      }

      const qInstances: QuestionnaireInstanceQuestionnairePair<QuestionnaireInstanceNew>[] =
        questionnaires
          .filter((questionnaire) => {
            if (
              NotificationHandlers.hasExternalCondition(questionnaire) ||
              (!user.compliance_samples && questionnaire.compliance_needed)
            ) {
              return false;
            }
            return !(
              questionnaire.publish === 'hidden' ||
              (questionnaire.publish === 'testprobands' &&
                !user.is_test_proband)
            );
          })
          .flatMap((questionnaire) =>
            QuestionnaireInstancesService.createQuestionnaireInstances(
              questionnaire,
              user,
              NotificationHandlers.hasInternalCondition(questionnaire),
              onlyLoginDependantOnes
            ).map(
              (
                questionnaireInstance
              ): QuestionnaireInstanceQuestionnairePair<QuestionnaireInstanceNew> => ({
                questionnaireInstance,
                questionnaire,
              })
            )
          );

      await NotificationHandlers.createQuestionnaireInstances(t, qInstances);
      NotificationHandlers.logger.info(
        `Added ${qInstances.length} questionnaire instances to db for user ${user.pseudonym}`
      );
    });
  }

  private static async createQuestionnaireInstances(
    t: ITask<unknown>,
    instancesWithQuestionnaires: QuestionnaireInstanceQuestionnairePair<QuestionnaireInstanceNew>[]
  ): Promise<QuestionnaireInstance[]> {
    // Insert questionnaire instances
    if (instancesWithQuestionnaires.length > 0) {
      const qQuestionnaireInstances = pgp.helpers.insert(
        instancesWithQuestionnaires.map((dto) => dto.questionnaireInstance),
        NotificationHandlers.csQuestionnaireInstances
      );
      const result = await t.manyOrNone<QuestionnaireInstance>(
        qQuestionnaireInstances + 'RETURNING *'
      );

      for (const instance of result) {
        const questionnaire = instancesWithQuestionnaires.find(
          (dto) =>
            dto.questionnaireInstance.questionnaire_id ===
              instance.questionnaire_id &&
            dto.questionnaireInstance.questionnaire_version ===
              instance.questionnaire_version
        )!.questionnaire;

        await messageQueueService.sendQuestionnaireInstanceCreated(
          instance,
          questionnaire
        );
      }

      return result;
    }

    return [];
  }

  private static hasInternalCondition(
    qCondition: Condition | QuestionnaireWithConditionType | null
  ): boolean {
    return qCondition?.condition_type === 'internal_last';
  }

  private static hasExternalCondition(
    qCondition: Condition | QuestionnaireWithConditionType | null
  ): boolean {
    return qCondition?.condition_type === 'external';
  }

  private static isFirstLogin(proband: Proband): boolean {
    return proband.first_logged_in_at === null;
  }

  private static isUserDeleted(user: Proband): boolean {
    return user.status === 'deleted';
  }

  private static isUserActiveInStudy(user: Proband): boolean {
    return user.status === 'active';
  }

  private static isDeactivationChange(
    oldQuestionnaire: Questionnaire,
    newQuestionnaire: Questionnaire
  ): boolean {
    return oldQuestionnaire.active && !newQuestionnaire.active;
  }

  private static isOverwritingEmptyCustomName(
    oldQuestionnaire: Questionnaire,
    newQuestionnaire: Questionnaire
  ): boolean {
    return !oldQuestionnaire.custom_name && !!newQuestionnaire.custom_name;
  }
}
