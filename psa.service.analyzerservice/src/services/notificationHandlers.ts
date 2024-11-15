/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ITask } from 'pg-promise';

import {
  Questionnaire,
  QuestionnaireWithConditionType,
} from '../models/questionnaire';
import { QuestionnaireInstancesService } from './questionnaireInstancesService';
import { QuestionnaireInstance } from '../models/questionnaireInstance';
import { db } from '../db';
import { Answer, AnswerWithCondition } from '../models/answer';
import { Proband } from '../models/proband';
import { startOfToday } from 'date-fns';
import { Condition } from '../models/condition';
import { AnswerOption } from '../models/answerOption';
import { asyncForEach } from '@pia/lib-service-core';
import { LoggingService } from './loggingService';
import { ProbandsRepository } from '../repositories/probandsRepository';
import {
  isUserActiveInStudy,
  isQuestionnaireAvailableToProband,
} from '../utilities/probands';
import { ConditionsService } from './conditionsService';
import { QuestionnaireService } from './questionnaireService';
import { questionnaireserviceClient } from '../clients/questionnaireserviceClient';
import { CreateQuestionnaireInstanceInternalDto } from '@pia-system/lib-http-clients-internal';

/**
 * @description handler methods that handle db notifications
 */
export class NotificationHandlers {
  private static readonly logger = new LoggingService('NotificationHandlers');

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

    if (!isUserActiveInStudy(proband)) {
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

    if (!isUserActiveInStudy(user)) {
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
      const qInstancesToAdd: CreateQuestionnaireInstanceInternalDto[] = [];

      const questionnaireOfInstance: Questionnaire = await t.one(
        'SELECT * FROM questionnaires WHERE id=$1 AND version=$2',
        [instance_new.questionnaire_id, instance_new.questionnaire_version]
      );

      // select only the newest versions of all questionnaires
      const answersWithConditionOfOtherQuestionnaires: AnswerWithCondition[] =
        await QuestionnaireInstancesService.getAnswersWithCondition(
          t,
          instance_new.id,
          answerVersion
        );

      // Create next instance for Spontan FB
      if (
        instance_new.status === 'released_once' &&
        questionnaireOfInstance.cycle_unit === 'spontan'
      ) {
        qInstancesToAdd.push(
          QuestionnaireInstancesService.createNextQuestionnaireInstance(
            questionnaireOfInstance,
            instance_new
          )
        );
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
        async (answerWithCondition) => {
          const questionnaire: Questionnaire =
            await QuestionnaireService.getQuestionnaire(
              t,
              answerWithCondition.condition_questionnaire_id,
              answerWithCondition.condition_questionnaire_version
            );

          if (!isQuestionnaireAvailableToProband(questionnaire, user)) {
            return;
          }

          // Do not create instances for hidden questionnaires
          if (questionnaire.publish === 'hidden') {
            return;
          }

          // Do not create instances for inactive questionnaires
          if (!questionnaire.active) {
            return;
          }

          const conditionTargetAnswerOption: AnswerOption =
            await QuestionnaireInstancesService.getAnswerOption(
              t,
              answerWithCondition.answer_option_id
            );

          // Create instances for referenced questionnaires in external conditions
          if (
            ConditionsService.doesSatisfyExternalCondition(answerWithCondition)
          ) {
            const conditionWasMet = ConditionsService.isConditionMet(
              answerWithCondition,
              answerWithCondition,
              conditionTargetAnswerOption.answer_type_id
            );

            // Questionnaire was answered the first time, just check condition and add instance for referenced questionnaire
            if (answerVersion === 1 && conditionWasMet) {
              const newInstances =
                QuestionnaireInstancesService.createQuestionnaireInstances(
                  questionnaire,
                  user,
                  false
                );

              if (
                questionnaire.type === 'for_probands' &&
                questionnaireOfInstance.type === 'for_probands'
              ) {
                newInstances.forEach((newInstance) => {
                  newInstance.options = {
                    ...newInstance.options,
                    addToQueue: newInstance.status === 'active',
                  };
                });
              }

              newInstances.forEach((newInstance) => {
                newInstance.origin = {
                  originInstance: instance_new.id,
                  condition: answerWithCondition.condition_id,
                };
              });

              qInstancesToAdd.push(...newInstances);
            }
            // Questionnaire was answered before, if condition is met now and was not before: add instance for referenced questionnaire
            else if (answerVersion > 1 && conditionWasMet) {
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
                !ConditionsService.isConditionMet(
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

                if (questionnaire.type === 'for_probands') {
                  newInstances.forEach((newInstance) => {
                    newInstance.options = {
                      ...newInstance.options,
                      addToQueue: newInstance.status === 'active',
                    };
                  });
                }

                newInstances.forEach((newInstance) => {
                  newInstance.origin = {
                    originInstance: instance_new.id,
                    condition: answerWithCondition.condition_id,
                  };
                });

                qInstancesToAdd.push(...newInstances);
              }
            }
            // Questionnaire was answered before, if condition is not met now but was before: remove unanswered old instance for referenced questionnaire
            else if (answerVersion > 1 && !conditionWasMet) {
              const oldAnswer: Answer | null =
                await QuestionnaireInstancesService.getAnswer(
                  t,
                  answerWithCondition.questionnaire_instance_id,
                  answerWithCondition.answer_option_id,
                  answerVersion - 1
                );

              if (
                oldAnswer &&
                ConditionsService.isConditionMet(
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
              ConditionsService.isConditionMet(
                answerWithCondition,
                answerWithCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              qInstancesToAdd.push(
                QuestionnaireInstancesService.createNextQuestionnaireInstance(
                  questionnaire,
                  instance_new
                )
              );
            } else if (
              // eslint-disable-next-line @typescript-eslint/no-magic-numbers
              answerVersion === 2 &&
              ConditionsService.isConditionMet(
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
                !ConditionsService.isConditionMet(
                  oldAnswer,
                  answerWithCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                qInstancesToAdd.push(
                  QuestionnaireInstancesService.createNextQuestionnaireInstance(
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
        const insertedInstances =
          await NotificationHandlers.createQuestionnaireInstances(
            qInstancesToAdd
          );

        NotificationHandlers.logger.info(
          `Added ${insertedInstances.length} questionnaire instances to db for conditional questionnaires for user: ${instance_new.user_id}`
        );

        const queuedInstances = insertedInstances.filter(
          (qi) => qi.options?.addToQueue
        );

        if (queuedInstances.length > 0) {
          NotificationHandlers.logger.info(
            `Added ${queuedInstances.length} instance queues to db for external conditioned instances for user: ${instance_new.user_id}`
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
    const qCondition: Condition | null =
      await ConditionsService.getConditionFor(t, questionnaire);

    if (probands.length === 0) {
      return;
    }

    const qInstances: CreateQuestionnaireInstanceInternalDto[] = [];

    await asyncForEach(probands, async (proband) => {
      if (!isQuestionnaireAvailableToProband(questionnaire, proband)) {
        return;
      }

      if (
        qCondition &&
        ConditionsService.doesSatisfyExternalCondition(qCondition)
      ) {
        const conditionTargetAnswerOption: AnswerOption =
          await QuestionnaireInstancesService.getAnswerOption(
            t,
            qCondition.condition_target_answer_option
          );

        const conditionTargetAnswer =
          await QuestionnaireInstancesService.getLatestAnswersForCondition(
            t,
            proband,
            qCondition
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
            !ConditionsService.isConditionMet(
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
            ConditionsService.isConditionMet(
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
          const dateOfRelease = ConditionsService.getDateOfReleaseFromAnswers(
            conditionTargetAnswer
          );
          if (
            dateOfRelease &&
            ConditionsService.doesLatestAnswerMeetCondition(
              conditionTargetAnswer,
              qCondition,
              conditionTargetAnswerOption.answer_type_id
            )
          ) {
            // this will have an effect on the start date of questionnaire instances which
            // will be created later on (@see questionnaireInstancesService#createQuestionnaireInstances)
            proband.first_logged_in_at = new Date(
              dateOfRelease.setHours(0, 0, 0, 0)
            );
          } else {
            return;
          }
        } else {
          return;
        }
      }

      qInstances.push(
        ...QuestionnaireInstancesService.createQuestionnaireInstances(
          questionnaire,
          proband,
          ConditionsService.doesSatisfyInternalCondition(qCondition)
        )
      );
    });

    await NotificationHandlers.createQuestionnaireInstances(qInstances);
    NotificationHandlers.logger.info(
      `Added ${
        qInstances.length
      } questionnaire instances to db for inserted questionnaire: ${NotificationHandlers.logger.printQuestionnaire(
        questionnaire
      )}`
    );
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

      const qInstances: CreateQuestionnaireInstanceInternalDto[] =
        questionnaires
          .filter((questionnaire) => {
            if (
              ConditionsService.doesSatisfyExternalCondition(questionnaire) ||
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
              ConditionsService.doesSatisfyInternalCondition(questionnaire),
              onlyLoginDependantOnes
            )
          );

      await NotificationHandlers.createQuestionnaireInstances(qInstances);
      NotificationHandlers.logger.info(
        `Added ${qInstances.length} questionnaire instances to db for user ${user.pseudonym}`
      );
    });
  }

  private static async createQuestionnaireInstances(
    instances: CreateQuestionnaireInstanceInternalDto[]
  ): Promise<CreateQuestionnaireInstanceInternalDto[]> {
    if (instances.length > 0) {
      return questionnaireserviceClient.createQuestionnaireInstances(instances);
    }

    return [];
  }

  private static isFirstLogin(proband: Proband): boolean {
    return proband.first_logged_in_at === null;
  }

  private static isUserDeleted(user: Proband): boolean {
    return user.status === 'deleted';
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
