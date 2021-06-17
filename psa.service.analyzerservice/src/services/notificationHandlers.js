require('datejs');
const pgp = require('pg-promise')();

const questionnaireInstancesService = require('./questionnaireInstancesService.js');

/**
 * @description handler methods that handle db notifications
 */
const notificationHandlers = (function () {
  async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  const csQuestionnaireInstances = new pgp.helpers.ColumnSet(
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

  const csQuestionnaireInstancesQueued = new pgp.helpers.ColumnSet(
    ['user_id', 'questionnaire_instance_id', 'date_of_queue'],
    { table: 'questionnaire_instances_queued' }
  );

  async function handleInsertedQuestionnaire(db, questionnaire) {
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
          console.log(
            'Deleted ' +
              deletedQIs.length +
              ' QIs from DB before inserting new Questionnaire version: ' +
              questionnaire.name
          );
        } else {
          console.log(
            'versioning of ' +
              questionnaire.cycle_unit +
              'does currently not support deletion of questionnaireInstances'
          );
        }
      }

      if (questionnaire.publish === 'hidden') {
        return;
      }

      const qCondition = await t.oneOrNone(
        'SELECT * FROM conditions WHERE condition_questionnaire_id=${id} AND condition_questionnaire_version=${version}',
        {
          id: questionnaire.id,
          version: questionnaire.version,
        }
      );
      let hasInternalCondition = false;
      let hasExternalCondition = false;
      if (
        qCondition !== null &&
        qCondition.condition_type === 'internal_last'
      ) {
        hasInternalCondition = true;
      } else if (
        qCondition !== null &&
        qCondition.condition_type === 'external'
      ) {
        hasExternalCondition = true;
      }

      // Add new instances
      let users;
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
      if (users && users.length > 0) {
        const qInstances = [];
        await asyncForEach(users, async function (user) {
          if (!user.compliance_samples && questionnaire.compliance_needed) {
            return;
          }

          if (
            questionnaire.publish === 'testprobands' &&
            !user.is_test_proband
          ) {
            return;
          }

          if (hasExternalCondition) {
            const conditionTargetAnswerOption = await t.one(
              'SELECT * FROM answer_options WHERE id=$1',
              [qCondition.condition_target_answer_option]
            );
            const conditionTargetAnswer = await t.manyOrNone(
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
                !questionnaireInstancesService.isConditionMet(
                  conditionTargetAnswer[conditionTargetAnswer.length - 1],
                  qCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                return;
              }
            } else if (conditionTargetAnswer.length === 2) {
              if (
                questionnaireInstancesService.isConditionMet(
                  conditionTargetAnswer[1],
                  qCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                // this will have an effect on the start date of questionnaire instances which
                // will be created later on (@see questionnaireInstancesService#createQuestionnaireInstances)
                user.first_logged_in_at = new Date(
                  conditionTargetAnswer[1].date_of_release_v2
                ).setHours(0, 0, 0, 0);
              } else {
                return;
              }
            } else if (conditionTargetAnswer.length === 1) {
              if (
                questionnaireInstancesService.isConditionMet(
                  conditionTargetAnswer[0],
                  qCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                // this will have an effect on the start date of questionnaire instances which
                // will be created later on (@see questionnaireInstancesService#createQuestionnaireInstances)
                user.first_logged_in_at = new Date(
                  conditionTargetAnswer[0].date_of_release_v1
                ).setHours(0, 0, 0, 0);
              } else {
                return;
              }
            } else {
              return;
            }
          }
          const newInstances =
            await questionnaireInstancesService.createQuestionnaireInstances(
              questionnaire,
              user,
              hasInternalCondition
            );
          newInstances.forEach(function (newInstance) {
            qInstances.push(newInstance);
          });
        });

        // Insert questionnaire instances
        if (qInstances.length > 0) {
          const qQuestionnaireInstances = pgp.helpers.insert(
            qInstances,
            csQuestionnaireInstances
          );
          await t.manyOrNone(qQuestionnaireInstances);
        }
        console.log(
          'Added ' +
            qInstances.length +
            ' questionnaire instances to db for inserted questionnaire: ' +
            questionnaire.name
        );
      }
    });
  }

  async function handleUpdatedQuestionnaire(db, q_old, q_new) {
    await db.tx(async function (t) {
      // Delete all old qIs
      await t.manyOrNone(
        'DELETE FROM notification_schedules WHERE notification_type=$1 AND reference_id::integer=ANY(SELECT id FROM questionnaire_instances WHERE questionnaire_id=$2 and questionnaire_version=$3)',
        ['qReminder', q_old.id, q_old.version]
      );
      const deletedQIs = await t.manyOrNone(
        'DELETE FROM questionnaire_instances WHERE questionnaire_id=${qId} AND questionnaire_version=${qVersion} RETURNING id',
        {
          qId: q_old.id,
          qVersion: q_old.version,
        }
      );
      console.log(
        'Deleted ' +
          deletedQIs.length +
          ' QIs from DB before updating Questionnaire: ' +
          q_new.name
      );
      if (q_new.publish === 'hidden') {
        return;
      }
      const qCondition = await t.oneOrNone(
        'SELECT * FROM conditions WHERE condition_questionnaire_id=${id} AND condition_questionnaire_version=${version}',
        {
          id: q_new.id,
          version: q_new.version,
        }
      );
      let hasInternalCondition = false;
      let hasExternalCondition = false;
      if (
        qCondition !== null &&
        qCondition.condition_type === 'internal_last'
      ) {
        hasInternalCondition = true;
      } else if (
        qCondition !== null &&
        qCondition.condition_type === 'external'
      ) {
        hasExternalCondition = true;
      }

      const users = await t.manyOrNone(
        'SELECT * FROM users WHERE role=${role} AND username=ANY(SELECT user_id FROM study_users WHERE study_id=${study_id} )',
        {
          role: 'Proband',
          study_id: q_new.study_id,
        }
      );

      if (users !== null && users !== undefined && users.length > 0) {
        const qInstances = [];
        await asyncForEach(users, async function (user) {
          if (!user.compliance_samples && q_new.compliance_needed) {
            return;
          }

          if (q_new.publish === 'testprobands' && !user.is_test_proband) {
            return;
          }

          if (hasExternalCondition) {
            const conditionTargetAnswerOption = await t.one(
              'SELECT * FROM answer_options WHERE id=$1',
              [qCondition.condition_target_answer_option]
            );
            const conditionTargetAnswer = await t.manyOrNone(
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
            if (q_new.type === 'for_research_team') {
              // Don't care about first_logged_in_at. It's not regarded in createQuestionnaireInstances
              // or getDatesForQuestionnaireInstances for research team questionnaires. The only
              // important thing is, we must continue execution as long as the condition is met.
              if (!conditionTargetAnswer.length) {
                return;
              }
              if (
                !questionnaireInstancesService.isConditionMet(
                  conditionTargetAnswer[conditionTargetAnswer.length - 1],
                  qCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                return;
              }
            } else if (conditionTargetAnswer.length === 2) {
              if (
                questionnaireInstancesService.isConditionMet(
                  conditionTargetAnswer[1],
                  qCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                // this will have an effect on the start date of questionnaire instances which
                // will be created later on (@see questionnaireInstancesService#createQuestionnaireInstances)
                user.first_logged_in_at = new Date(
                  conditionTargetAnswer[1].date_of_release_v2
                ).setHours(0, 0, 0, 0);
              } else {
                return;
              }
            } else if (conditionTargetAnswer.length === 1) {
              if (
                questionnaireInstancesService.isConditionMet(
                  conditionTargetAnswer[0],
                  qCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                // this will have an effect on the start date of questionnaire instances which
                // will be created later on (@see questionnaireInstancesService#createQuestionnaireInstances)
                user.first_logged_in_at = new Date(
                  conditionTargetAnswer[0].date_of_release_v1
                ).setHours(0, 0, 0, 0);
              } else {
                return;
              }
            } else {
              return;
            }
          }
          const newInstances =
            await questionnaireInstancesService.createQuestionnaireInstances(
              q_new,
              user,
              hasInternalCondition
            );
          newInstances.forEach(function (newInstance) {
            qInstances.push(newInstance);
          });
        });

        // Insert questionnaire instances
        if (qInstances.length > 0) {
          const qQuestionnaireInstances = pgp.helpers.insert(
            qInstances,
            csQuestionnaireInstances
          );
          await t.manyOrNone(qQuestionnaireInstances);
        }
        console.log(
          'Added ' +
            qInstances.length +
            ' questionnaire instances to db for inserted questionnaire: ' +
            q_new.name
        );
      }
    });
  }

  async function handleUpdatedUser(db, user_old, user_new) {
    if (
      !user_old.first_logged_in_at &&
      user_new.first_logged_in_at &&
      user_new.role === 'Proband'
    ) {
      await db.tx(async function (t) {
        // Retrieve questionnaires with newest versions version only
        const questionnaires = await t.manyOrNone(
          'SELECT questionnaires.*, conditions.condition_type FROM questionnaires ' +
            'LEFT JOIN conditions ON questionnaires.id=conditions.condition_questionnaire_id ' +
            'AND questionnaires.version=conditions.condition_questionnaire_version ' +
            'WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id=$1) ' +
            'AND version=(SELECT MAX(q.version) FROM questionnaires as q WHERE q.id=questionnaires.id)',
          [user_new.username]
        );

        if (
          questionnaires !== null &&
          questionnaires !== undefined &&
          questionnaires.length > 0
        ) {
          const qInstances = [];
          await asyncForEach(questionnaires, async function (questionnaire) {
            if (
              questionnaire.condition_type === 'external' ||
              (!user_new.compliance_samples && questionnaire.compliance_needed)
            ) {
              return;
            }

            if (questionnaire.publish === 'hidden') {
              return;
            }
            if (
              questionnaire.publish === 'testprobands' &&
              !user_new.is_test_proband
            ) {
              return;
            }

            const newInstances =
              await questionnaireInstancesService.createQuestionnaireInstances(
                questionnaire,
                user_new,
                questionnaire.condition_type === 'internal_last',
                true
              );
            newInstances.forEach(function (newInstance) {
              qInstances.push(newInstance);
            });
          });

          // Insert questionnaire instances
          if (qInstances.length > 0) {
            const qQuestionnaireInstances = pgp.helpers.insert(
              qInstances,
              csQuestionnaireInstances
            );
            await t.manyOrNone(qQuestionnaireInstances);
          }
          console.log(
            'Added ' +
              qInstances.length +
              ' questionnaire instances to db for user ' +
              user_new.username
          );
        }
      });
    }
  }

  async function handleInsertedStudyUser(db, study_user) {
    const correspondingUser = await db.one(
      'SELECT * FROM users where username = $1',
      [study_user.user_id]
    );
    if (correspondingUser.role === 'Proband') {
      await db.tx(async function (t) {
        // Retrieve questionnaires with newest versions version only
        const questionnaires = await t.manyOrNone(
          'SELECT questionnaires.*, conditions.condition_type FROM questionnaires LEFT JOIN conditions ON questionnaires.id=conditions.condition_questionnaire_id AND questionnaires.version=conditions.condition_questionnaire_version ' +
            'WHERE study_id=$1 AND version=(SELECT MAX(q.version) FROM questionnaires as q where q.id=questionnaires.id)',
          [study_user.study_id]
        );

        if (
          questionnaires !== null &&
          questionnaires !== undefined &&
          questionnaires.length > 0
        ) {
          const qInstances = [];
          await asyncForEach(questionnaires, async function (questionnaire) {
            if (
              questionnaire.condition_type === 'external' ||
              (!correspondingUser.compliance_samples &&
                questionnaire.compliance_needed)
            ) {
              return;
            }
            if (questionnaire.publish === 'hidden') {
              return;
            }
            if (
              questionnaire.publish === 'testprobands' &&
              !correspondingUser.is_test_proband
            ) {
              return;
            }
            const newInstances =
              await questionnaireInstancesService.createQuestionnaireInstances(
                questionnaire,
                correspondingUser,
                questionnaire.condition_type === 'internal_last'
              );
            newInstances.forEach(function (newInstance) {
              qInstances.push(newInstance);
            });
          });

          // Insert questionnaire instances
          if (qInstances.length > 0) {
            const qQuestionnaireInstances = pgp.helpers.insert(
              qInstances,
              csQuestionnaireInstances
            );
            await t.manyOrNone(qQuestionnaireInstances);
          }
          console.log(
            'Added ' +
              qInstances.length +
              ' questionnaire instances to db for user ' +
              study_user.user_id +
              ' who was added to study: ' +
              study_user.study_id
          );
        }
      });
    }
  }

  async function handleDeletedStudyUser(db, study_user) {
    const correspondingUser = await db.one(
      'SELECT * FROM users where username = $1',
      [study_user.user_id]
    );
    if (correspondingUser.role === 'Proband') {
      const deletedQIs = await db.manyOrNone(
        'DELETE FROM questionnaire_instances WHERE user_id=$1 AND study_id=$2 RETURNING *',
        [study_user.user_id, study_user.study_id]
      );
      console.log(
        'deleted ' +
          deletedQIs.length +
          ' questionnaire instances for user: ' +
          study_user.user_id +
          ' because he was removed from study: ' +
          study_user.study_id
      );
    }
  }

  async function handleUpdatedInstance(db, instance_old, instance_new) {
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
      answerVersion = 2;
    } else if (instance_new.status === 'released') {
      answerVersion = instance_new.release_version;
    }

    await db.tx(async function (t) {
      const qInstancesToAdd = [];
      const activeQInstancesFromExternalConditionsToBeQueued = [];

      const questionnaireOfInstance = await t.one(
        'SELECT * FROM questionnaires WHERE id=$1 AND version=$2',
        [instance_new.questionnaire_id, instance_new.questionnaire_version]
      );
      const answersWithConditionOfOtherQuestionnaires = await t.manyOrNone(
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
          await questionnaireInstancesService.createNextQuestionnaireInstance(
            questionnaireOfInstance,
            instance_new
          )
        );
      } else if (answersWithConditionOfOtherQuestionnaires.length < 1) {
        // No conditions to check, stop here
        return;
      }
      const user = await t.one('SELECT * FROM users WHERE username=$1', [
        instance_new.user_id,
      ]);
      // this will have an effect on the start date of questionnaire instances which
      // will be created later on (@see questionnaireInstancesService#createQuestionnaireInstances)
      user.first_logged_in_at = new Date(Date.today());
      await asyncForEach(
        answersWithConditionOfOtherQuestionnaires,
        async function (answerWithCondition) {
          const conditionTargetAnswerOption = await t.one(
            'SELECT * FROM answer_options WHERE id=$1',
            [answerWithCondition.answer_option_id]
          );
          const questionnaire = await t.one(
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

          // Create instances for referenced questionnaires in external conditions
          if (answerWithCondition.condition_type === 'external') {
            // Questionnaire was answered the first time, just check condition and add instance for referenced questionnaire
            if (
              answerVersion === 1 &&
              questionnaireInstancesService.isConditionMet(
                answerWithCondition,
                answerWithCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              const newInstances =
                await questionnaireInstancesService.createQuestionnaireInstances(
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
              questionnaireInstancesService.isConditionMet(
                answerWithCondition,
                answerWithCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              const oldAnswer = await t.oneOrNone(
                'SELECT * FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2 AND versioning=$3',
                [
                  answerWithCondition.questionnaire_instance_id,
                  answerWithCondition.answer_option_id,
                  answerVersion - 1,
                ]
              );
              if (
                !oldAnswer ||
                !questionnaireInstancesService.isConditionMet(
                  oldAnswer,
                  answerWithCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                const newInstances =
                  await questionnaireInstancesService.createQuestionnaireInstances(
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
              !questionnaireInstancesService.isConditionMet(
                answerWithCondition,
                answerWithCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              const oldAnswer = await t.oneOrNone(
                'SELECT * FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2 AND versioning=$3',
                [
                  answerWithCondition.questionnaire_instance_id,
                  answerWithCondition.answer_option_id,
                  answerVersion - 1,
                ]
              );
              if (
                oldAnswer &&
                questionnaireInstancesService.isConditionMet(
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
                console.log(
                  'deleted ' +
                    result.length +
                    ' questionnaire instances for questionnaire ' +
                    questionnaire.name +
                    ' whos condition was met before but is not now'
                );
              }
            }
          }
          // Create next instance for now met internal_last conditions
          else if (answerWithCondition.condition_type === 'internal_last') {
            if (
              answerVersion === 1 &&
              questionnaireInstancesService.isConditionMet(
                answerWithCondition,
                answerWithCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              qInstancesToAdd.push(
                await questionnaireInstancesService.createNextQuestionnaireInstance(
                  questionnaire,
                  instance_new
                )
              );
            } else if (
              answerVersion === 2 &&
              questionnaireInstancesService.isConditionMet(
                answerWithCondition,
                answerWithCondition,
                conditionTargetAnswerOption.answer_type_id
              )
            ) {
              const oldAnswer = await t.oneOrNone(
                'SELECT * FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2 AND versioning=$3',
                [
                  answerWithCondition.questionnaire_instance_id,
                  answerWithCondition.answer_option_id,
                  1,
                ]
              );
              if (
                !oldAnswer ||
                !questionnaireInstancesService.isConditionMet(
                  oldAnswer,
                  answerWithCondition,
                  conditionTargetAnswerOption.answer_type_id
                )
              ) {
                qInstancesToAdd.push(
                  await questionnaireInstancesService.createNextQuestionnaireInstance(
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
          pgp.helpers.insert(qInstancesToAdd, csQuestionnaireInstances) +
          'RETURNING *';
        const insertedInstances = await t.manyOrNone(qQuestionnaireInstances);
        console.log(
          'Added ' +
            insertedInstances.length +
            ' questionnaire instances to db for conditional questionnaires for user: ' +
            instance_new.user_id
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
          const queuesToInsert = [];
          instancesForQueue.forEach((instance) => {
            let date_of_queue = new Date();
            if (
              instance.questionnaire_name === 'Nasenabstrich' ||
              instance.questionnaire_name ===
                'Nach Spontanmeldung: Nasenabstrich'
            ) {
              date_of_queue = new Date().addMinutes(1);
            }
            queuesToInsert.push({
              user_id: instance.user_id,
              questionnaire_instance_id: instance.id,
              date_of_queue: date_of_queue,
            });
          });
          const qQuestionnaireInstancesQueued =
            pgp.helpers.insert(queuesToInsert, csQuestionnaireInstancesQueued) +
            'RETURNING *';
          const insertedQueues = await t.manyOrNone(
            qQuestionnaireInstancesQueued
          );
          console.log(
            'Added ' +
              insertedQueues.length +
              ' instance queues to db for external conditioned instances for user: ' +
              instance_new.user_id
          );
        }
      }
    });
  }

  return {
    /**
     * @function
     * @description creates questionnaire instances based on the inserted questionnaire
     * @memberof module:notificationHandlers
     * @param {Object} db the connected postgresql db object
     * @param {Object} questionnaire the inserted questionnaire
     */
    handleInsertedQuestionnaire: handleInsertedQuestionnaire,

    /**
     * @function
     * @description updates questionnaire instances based on the updated questionnaire
     * @memberof module:notificationHandlers
     * @param {Object} db the connected postgresql db object
     * @param {Object} q_old the old questionnaire
     * @param {Object} q_new the updated questionnaire
     */
    handleUpdatedQuestionnaire: handleUpdatedQuestionnaire,

    /**
     * @function
     * @description creates questionnaire instances based on the updated user
     * @memberof module:notificationHandlers
     * @param {Object} db the connected postgresql db object
     * @param {Object} user_old the old user
     * @param {Object} user_new the updated user
     */
    handleUpdatedUser: handleUpdatedUser,

    /**
     * @function
     * @description creates questionnaire instances based on the inserted study_user
     * @memberof module:notificationHandlers
     * @param {Object} db the connected postgresql db object
     * @param {Object} study_user the inserted study_user
     */
    handleInsertedStudyUser: handleInsertedStudyUser,

    /**
     * @function
     * @description deletes questionnaire instances based on the deleted study_user
     * @memberof module:notificationHandlers
     * @param {Object} db the connected postgresql db object
     * @param {Object} study_user the old study_user
     */
    handleDeletedStudyUser: handleDeletedStudyUser,

    /**
     * @function
     * @description checks updated questionnaire instance and might create or delete questionnaire instances based on connected conditional questionnaire
     * @memberof module:notificationHandlers
     * @param {Object} db the connected postgresql db object
     * @param {Object} answer the inserted answer
     */
    handleUpdatedInstance: handleUpdatedInstance,
  };
})();

module.exports = notificationHandlers;
