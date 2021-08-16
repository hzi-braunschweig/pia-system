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
} from '../models/questionnaireInstance';
import { db } from '../db';
import { Answer } from '../models/answer';
import { StudyUser, User } from '../models/user';
import { addMinutes, startOfToday } from 'date-fns';
import { Condition } from '../models/condition';
import { AnswerOption } from '../models/answerOption';
import { asyncForEach } from '@pia/lib-service-core';
import { LoggingService } from './loggingService';

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
      let users: User[];
      if (questionnaire.cycle_unit === 'once') {
        // if it is a one time questionnaire we do not need to create a new instance for users who already answered one (those instances survived above)
        users = await t.manyOrNone(
          `SELECT *
                     FROM study_users as s
                              LEFT JOIN users u on u.username = s.user_id
                     WHERE s.study_id = $(study_id)
                       AND u.role = 'Proband'
                       AND u.username NOT IN
                           (SELECT user_id FROM questionnaire_instances WHERE questionnaire_id = $(id))`,
          questionnaire
        );
      } else {
        // other questionnaires need to be created anyway (like spontaneous ones need to replace the active one that was deleted above)
        users = await t.manyOrNone(
          `SELECT *
                     FROM study_users as s
                              LEFT JOIN users u on u.username = s.user_id
                     WHERE s.study_id = $(study_id)
                       AND u.role = 'Proband'`,
          questionnaire
        );
      }

      await NotificationHandlers.createQuestionnaireInstancesForUsers(
        questionnaire,
        users,
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
    if (NotificationHandlers.isDeactivationChange(q_old, q_new)) {
      // Do nothing if a questionnaire is deactivated
      // inactive and active questionnaire_instances are already deleted from questionnaireservice
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

      const users: User[] = await t.manyOrNone(
        'SELECT * FROM users WHERE role=$(role) AND username=ANY(SELECT user_id FROM study_users WHERE study_id=$(study_id) )',
        {
          role: 'Proband',
          study_id: q_new.study_id,
        }
      );

      await NotificationHandlers.createQuestionnaireInstancesForUsers(
        q_new,
        users,
        t
      );
    });
  }

  /**
   * Creates questionnaire instances based on the updated user
   *
   * @param {Object} user_old the old user
   * @param {Object} user_new the updated user
   */
  public static async handleUpdatedUser(
    user_old: User,
    user_new: User
  ): Promise<void> {
    if (
      NotificationHandlers.isFirstLogin(user_old, user_new) &&
      user_new.role === 'Proband'
    ) {
      await NotificationHandlers.createQuestionnaireInstancesForUser(
        user_new,
        true
      );
    }
  }

  /**
   * Creates questionnaire instances based on the inserted study_user
   *
   * @param {Object} study_user the inserted study_user
   */
  public static async handleInsertedStudyUser(
    study_user: StudyUser
  ): Promise<void> {
    const correspondingUser: User = await db.one(
      "SELECT * FROM users WHERE username = $1 AND role='Proband'",
      [study_user.user_id]
    );
    await NotificationHandlers.createQuestionnaireInstancesForUser(
      correspondingUser
    );
  }

  /**
   * Deletes questionnaire instances based on the deleted study_user
   *
   * @param {Object} study_user the old study_user
   */
  public static async handleDeletedStudyUser(
    study_user: StudyUser
  ): Promise<void> {
    const correspondingUser: User = await db.one(
      'SELECT * FROM users where username = $1',
      [study_user.user_id]
    );
    if (correspondingUser.role === 'Proband') {
      const deletedQIs = await db.manyOrNone(
        'DELETE FROM questionnaire_instances WHERE user_id=$1 AND study_id=$2 RETURNING *',
        [study_user.user_id, study_user.study_id]
      );
      NotificationHandlers.logger.info(
        `Deleted ${deletedQIs.length} questionnaire instances for user: ${study_user.user_id} because he was removed from study: ${study_user.study_id}`
      );
    }
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
      const qInstancesToAdd: QuestionnaireInstanceNew[] = [];
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
        qInstancesToAdd.push(
          await QuestionnaireInstancesService.createNextQuestionnaireInstance(
            questionnaireOfInstance,
            instance_new
          )
        );
      } else if (answersWithConditionOfOtherQuestionnaires.length < 1) {
        // No conditions to check, stop here
        return;
      }
      const user: User = await t.one('SELECT * FROM users WHERE username=$1', [
        instance_new.user_id,
      ]);
      // this will have an effect on the start date of questionnaire instances which
      // will be created later on (@see questionnaireInstancesService#createQuestionnaireInstances)
      user.first_logged_in_at = startOfToday();

      await asyncForEach(
        answersWithConditionOfOtherQuestionnaires,
        async function (answerWithCondition) {
          const conditionTargetAnswerOption: AnswerOption = await t.one(
            'SELECT * FROM answer_options WHERE id=$1',
            [answerWithCondition.answer_option_id]
          );
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
          if (questionnaire.publish === 'hidden') {
            return;
          }
          if (
            questionnaire.publish === 'testprobands' &&
            !user.is_test_proband
          ) {
            return;
          }
          if (!questionnaire.active) {
            return;
          }

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
                await QuestionnaireInstancesService.createQuestionnaireInstances(
                  questionnaire,
                  user,
                  false
                );
              qInstancesToAdd.push(...newInstances);
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
                  await QuestionnaireInstancesService.createQuestionnaireInstances(
                    questionnaire,
                    user,
                    false
                  );
                qInstancesToAdd.push(...newInstances);
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
              qInstancesToAdd.push(
                await QuestionnaireInstancesService.createNextQuestionnaireInstance(
                  questionnaire,
                  instance_new
                )
              );
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
                qInstancesToAdd.push(
                  await QuestionnaireInstancesService.createNextQuestionnaireInstance(
                    questionnaire,
                    instance_new
                  )
                );
              }
            }
          }
        }
      );

      // Insert questionnaire instances
      if (qInstancesToAdd.length > 0) {
        const qQuestionnaireInstances =
          pgp.helpers.insert(
            qInstancesToAdd,
            NotificationHandlers.csQuestionnaireInstances
          ) + 'RETURNING *';
        const insertedInstances: QuestionnaireInstance[] = await t.manyOrNone(
          qQuestionnaireInstances
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

  private static async createQuestionnaireInstancesForUsers(
    questionnaire: Questionnaire,
    users: User[],
    t: ITask<unknown>
  ): Promise<void> {
    const qCondition: Condition | null = await t.oneOrNone(
      'SELECT * FROM conditions WHERE condition_questionnaire_id=$(id) AND condition_questionnaire_version=$(version)',
      {
        id: questionnaire.id,
        version: questionnaire.version,
      }
    );

    if (users.length > 0) {
      let qInstances: QuestionnaireInstanceNew[] = [];
      await asyncForEach(users, async (user) => {
        if (!user.compliance_samples && questionnaire.compliance_needed) {
          return;
        }

        if (questionnaire.publish === 'testprobands' && !user.is_test_proband) {
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
                user.username,
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
              user.first_logged_in_at = new Date(
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
              user.first_logged_in_at = new Date(
                conditionTargetAnswer[0].date_of_release_v1.setHours(0, 0, 0, 0)
              );
            } else {
              return;
            }
          } else {
            return;
          }
        }

        qInstances = qInstances.concat(
          await QuestionnaireInstancesService.createQuestionnaireInstances(
            questionnaire,
            user,
            NotificationHandlers.hasInternalCondition(qCondition)
          )
        );
      });

      await NotificationHandlers.createQuestionnaireInstances(qInstances, t);
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
    user: User,
    onlyLoginDependantOnes = false
  ): Promise<void> {
    await db.tx(async function (t) {
      // Retrieve questionnaires with newest version only
      const questionnaires: QuestionnaireWithConditionType[] =
        await t.manyOrNone(
          'SELECT questionnaires.*, conditions.condition_type FROM questionnaires ' +
            'LEFT JOIN conditions ON questionnaires.id=conditions.condition_questionnaire_id ' +
            'AND questionnaires.version=conditions.condition_questionnaire_version ' +
            'WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id=$1) ' +
            'AND version=(SELECT MAX(q.version) FROM questionnaires as q WHERE q.id=questionnaires.id) ' +
            'AND active=TRUE',
          [user.username]
        );

      if (questionnaires.length <= 0) {
        return;
      }

      let qInstances: QuestionnaireInstanceNew[] = [];
      await asyncForEach(questionnaires, async function (questionnaire) {
        if (
          NotificationHandlers.hasExternalCondition(questionnaire) ||
          (!user.compliance_samples && questionnaire.compliance_needed)
        ) {
          return;
        }
        if (questionnaire.publish === 'testprobands' && !user.is_test_proband) {
          return;
        }

        if (questionnaire.publish === 'hidden') {
          return;
        }

        qInstances = qInstances.concat(
          await QuestionnaireInstancesService.createQuestionnaireInstances(
            questionnaire,
            user,
            NotificationHandlers.hasInternalCondition(questionnaire),
            onlyLoginDependantOnes
          )
        );
      });

      await NotificationHandlers.createQuestionnaireInstances(qInstances, t);
      NotificationHandlers.logger.info(
        `Added ${qInstances.length} questionnaire instances to db for user ${user.username}`
      );
    });
  }

  private static async createQuestionnaireInstances(
    qInstances: QuestionnaireInstanceNew[],
    t: ITask<unknown>
  ): Promise<void> {
    // Insert questionnaire instances
    if (qInstances.length > 0) {
      const qQuestionnaireInstances = pgp.helpers.insert(
        qInstances,
        NotificationHandlers.csQuestionnaireInstances
      );
      await t.manyOrNone(qQuestionnaireInstances);
    }
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

  private static isFirstLogin(userOld: User, userNew: User): boolean {
    return !userOld.first_logged_in_at && !!userNew.first_logged_in_at;
  }

  private static isDeactivationChange(
    oldQuestionnaire: Questionnaire,
    newQuestionnaire: Questionnaire
  ): boolean {
    return oldQuestionnaire.active && !newQuestionnaire.active;
  }
}
