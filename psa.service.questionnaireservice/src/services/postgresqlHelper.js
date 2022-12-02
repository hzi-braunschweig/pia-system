/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const QueryStream = require('pg-query-stream');
const pgp = require('pg-promise')({ capSQL: true });
const { db } = require('../db');

function insertCondition(t, conditionObject, targetObject) {
  if (conditionObject) {
    delete conditionObject.condition_target_question_pos;
    delete conditionObject.condition_target_answer_option_pos;
    Object.assign(conditionObject, targetObject);
    return t.one(
      'INSERT INTO conditions(${this:name}) VALUES(${this:csv}) RETURNING *',
      conditionObject
    );
  } else return undefined;
}

async function answerOptionExists(t, answerOptionId) {
  const targetAnswerOptionIdRes = await t.oneOrNone(
    'SELECT id FROM answer_options WHERE id = ${id}',
    { id: answerOptionId }
  );
  if (targetAnswerOptionIdRes && targetAnswerOptionIdRes.id) {
    return true;
  } else {
    return false;
  }
}

async function questionnaireIsActive(
  t,
  questionnaireId,
  questionnaireVersion = 1
) {
  const targetQuestionnaireIdRes = await t.oneOrNone(
    'SELECT active FROM questionnaires WHERE id = ${id} AND version = ${version}',
    { id: questionnaireId, version: questionnaireVersion }
  );
  return !!targetQuestionnaireIdRes?.active;
}

const latestQuestionnaireVersionQuery =
  'SELECT version FROM questionnaires WHERE id=$1 ORDER BY version DESC LIMIT 1';

/**
 * @description helper methods to access db
 */
const postgresqlHelper = (function () {
  async function insertQuestionnaire(questionnaire) {
    const csQuestions = new db.$config.pgp.helpers.ColumnSet(
      [
        'questionnaire_id',
        'questionnaire_version',
        'text',
        'position',
        'is_mandatory',
        'variable_name',
      ],
      { table: 'questions' }
    );

    return db.tx(async (t) => {
      // Insert questionnaire
      return t
        .one(
          'INSERT INTO questionnaires(version, study_id, name, type, no_questions, cycle_amount, cycle_unit, publish, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, notification_weekday, notification_interval, notification_interval_unit, activate_at_date, compliance_needed, expires_after_days, finalises_after_days, notify_when_not_filled, notify_when_not_filled_time, notify_when_not_filled_day, cycle_per_day, cycle_first_hour, keep_answers) VALUES ($1:csv) RETURNING *',
          [
            [
              1, // New, first version
              questionnaire.study_id,
              questionnaire.name,
              questionnaire.type,
              questionnaire.questions.length,
              questionnaire.cycle_amount,
              questionnaire.cycle_unit,
              questionnaire.publish,
              questionnaire.activate_after_days,
              questionnaire.deactivate_after_days,
              questionnaire.notification_tries,
              questionnaire.notification_title,
              questionnaire.notification_body_new,
              questionnaire.notification_body_in_progress,
              questionnaire.notification_weekday,
              questionnaire.notification_interval,
              questionnaire.notification_interval_unit,
              questionnaire.activate_at_date
                ? questionnaire.activate_at_date
                : null,
              questionnaire.compliance_needed,
              questionnaire.expires_after_days
                ? questionnaire.expires_after_days
                : 5,
              questionnaire.finalises_after_days
                ? questionnaire.finalises_after_days
                : 2,
              questionnaire.notify_when_not_filled
                ? questionnaire.notify_when_not_filled
                : false,
              questionnaire.notify_when_not_filled_time
                ? questionnaire.notify_when_not_filled_time
                : null,
              questionnaire.notify_when_not_filled_day >= 0
                ? questionnaire.notify_when_not_filled_day
                : null,
              questionnaire.cycle_per_day ? questionnaire.cycle_per_day : null,
              questionnaire.cycle_first_hour
                ? questionnaire.cycle_first_hour
                : null,
              questionnaire.keep_answers,
            ],
          ]
        )
        .then(async (questionnaireResult) => {
          // Insert questions
          const vQuestions = [];
          questionnaire.questions.forEach(function (question) {
            vQuestions.push({
              questionnaire_id: questionnaireResult.id,
              questionnaire_version: questionnaireResult.version,
              text: question.text,
              position: question.position,
              is_mandatory: question.is_mandatory,
              variable_name: question.variable_name,
            });
          });
          const qQuestions =
            db.$config.pgp.helpers.insert(vQuestions, csQuestions) +
            'RETURNING *';

          return t.many(qQuestions).then(async function (questionsResult) {
            // Insert answer options
            for (let i = 0; i < questionnaire.questions.length; i++) {
              const answerOptionsResult = [];
              for (
                let j = 0;
                j < questionnaire.questions[i].answer_options.length;
                j++
              ) {
                const curAnswerOption =
                  questionnaire.questions[i].answer_options[j];
                const insertedAnswerOption = await t.one(
                  'INSERT INTO answer_options(question_id, text, answer_type_id, values, values_code, position, restriction_min, restriction_max, is_decimal, variable_name, is_notable) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
                  [
                    questionsResult[i].id,
                    curAnswerOption.text,
                    curAnswerOption.answer_type_id,
                    curAnswerOption.values.map((value) => value.value),
                    curAnswerOption.values_code
                      ? curAnswerOption.values_code.map((value) => value.value)
                      : null,
                    curAnswerOption.position,
                    curAnswerOption.restriction_min,
                    curAnswerOption.restriction_max,
                    curAnswerOption.is_decimal,
                    curAnswerOption.variable_name,
                    curAnswerOption.is_notable
                      ? curAnswerOption.is_notable.map((value) => value.value)
                      : null,
                  ]
                );
                answerOptionsResult.push(insertedAnswerOption);
              }
              questionsResult[i].answer_options = answerOptionsResult;
            }

            // Insert conditions after the questionnaire was completely saved
            if (questionnaire.condition) {
              if (
                (await answerOptionExists(
                  t,
                  questionnaire.condition.condition_target_answer_option
                )) &&
                (await questionnaireIsActive(
                  t,
                  questionnaire.condition.condition_target_questionnaire,
                  questionnaire.condition.condition_target_questionnaire_version
                ))
              ) {
                questionnaireResult.condition = await insertCondition(
                  t,
                  questionnaire.condition,
                  {
                    condition_questionnaire_id: questionnaireResult.id,
                    condition_questionnaire_version:
                      questionnaireResult.version,
                  }
                );
              } else {
                questionnaireResult.condition = questionnaire.condition;
                questionnaireResult.condition.error = 404;
              }
            }

            for (let i = 0; i < questionnaire.questions.length; i++) {
              const curQuestion = questionnaire.questions[i];
              const questionCondition = questionnaire.questions[i].condition;
              if (questionCondition) {
                if (questionCondition.condition_type === 'external') {
                  if (
                    (await answerOptionExists(
                      t,
                      questionCondition.condition_target_answer_option
                    )) &&
                    (await questionnaireIsActive(
                      t,
                      questionCondition.condition_target_questionnaire,
                      questionCondition.condition_target_questionnaire_version
                    ))
                  ) {
                    questionsResult[i].condition = await insertCondition(
                      t,
                      questionCondition,
                      { condition_question_id: questionsResult[i].id }
                    );
                  } else {
                    questionsResult[i].condition = questionCondition;
                    questionsResult[i].condition.error = 404;
                  }
                } else {
                  const curCondition = curQuestion.condition;
                  if (
                    curCondition.condition_target_question_pos !== undefined &&
                    curCondition.condition_target_question_pos !== null &&
                    curCondition.condition_target_answer_option_pos !==
                      undefined &&
                    curCondition.condition_target_answer_option_pos !== null
                  ) {
                    const targetQuestionIdRes = await t.one(
                      'SELECT id FROM questions WHERE questionnaire_id = ${qId} AND questionnaire_version = ${qVersion} AND position = ${p}',
                      {
                        qId: questionnaireResult.id,
                        qVersion: questionnaireResult.version,
                        p: curCondition.condition_target_question_pos,
                      }
                    );
                    const targetQuestionId = targetQuestionIdRes.id;
                    const targetAnswerOptionIdRes = await t.one(
                      'SELECT id FROM answer_options WHERE question_id = ${qId} AND position = ${p}',
                      {
                        qId: targetQuestionId,
                        p: curCondition.condition_target_answer_option_pos,
                      }
                    );
                    const targetAnswerOptionId = targetAnswerOptionIdRes.id;
                    curCondition.condition_target_answer_option =
                      targetAnswerOptionId;
                  }
                  curCondition.condition_question_id = questionsResult[i].id;
                  curCondition.condition_target_questionnaire =
                    questionnaireResult.id;
                  curCondition.condition_target_questionnaire_version =
                    questionnaireResult.version;
                  questionsResult[i].condition = await insertCondition(
                    t,
                    curCondition,
                    { condition_question_id: questionsResult[i].id }
                  );
                }
              }
              const answerOptionsResult = [];
              for (let j = 0; j < curQuestion.answer_options.length; j++) {
                const curAnswerOption = curQuestion.answer_options[j];
                let insertedAnswerOption;
                insertedAnswerOption = questionsResult[i].answer_options.find(
                  function (answerOption) {
                    return answerOption.position === curAnswerOption.position;
                  }
                );
                if (curAnswerOption.condition) {
                  if (curAnswerOption.condition.condition_type === 'external') {
                    if (
                      (await answerOptionExists(
                        t,
                        curAnswerOption.condition.condition_target_answer_option
                      )) &&
                      (await questionnaireIsActive(
                        t,
                        curAnswerOption.condition
                          .condition_target_questionnaire,
                        curAnswerOption.condition
                          .condition_target_questionnaire_version
                      ))
                    ) {
                      curAnswerOption.condition = await insertCondition(
                        t,
                        curAnswerOption.condition,
                        { condition_answer_option_id: insertedAnswerOption.id }
                      );
                    } else {
                      insertedAnswerOption.condition =
                        curAnswerOption.condition;
                      insertedAnswerOption.condition.error = 404;
                    }
                    insertedAnswerOption = curAnswerOption;
                  } else {
                    const curCondition = curAnswerOption.condition;
                    if (
                      curCondition.condition_target_question_pos !==
                        undefined &&
                      curCondition.condition_target_question_pos !== null &&
                      curCondition.condition_target_answer_option_pos !==
                        undefined &&
                      curCondition.condition_target_answer_option_pos !== null
                    ) {
                      const targetQuestionIdRes = await t.one(
                        'SELECT id FROM questions WHERE questionnaire_id = ${qId} AND questionnaire_version = ${qVersion} AND position = ${p}',
                        {
                          qId: questionnaireResult.id,
                          qVersion: questionnaireResult.version,
                          p: curCondition.condition_target_question_pos,
                        }
                      );
                      const targetQuestionId = targetQuestionIdRes.id;
                      const targetAnswerOptionIdRes = await t.one(
                        'SELECT id FROM answer_options WHERE question_id = ${qId} AND position = ${p}',
                        {
                          qId: targetQuestionId,
                          p: curCondition.condition_target_answer_option_pos,
                        }
                      );
                      const targetAnswerOptionId = targetAnswerOptionIdRes.id;
                      curCondition.condition_target_answer_option =
                        targetAnswerOptionId;
                    }
                    curCondition.condition_answer_option_id =
                      insertedAnswerOption.id;
                    curCondition.condition_target_questionnaire =
                      questionnaireResult.id;
                    curCondition.condition_target_questionnaire_version =
                      questionnaireResult.version;
                    insertedAnswerOption.condition = await insertCondition(
                      t,
                      curCondition,
                      { condition_answer_option_id: insertedAnswerOption.id }
                    );
                  }
                }
                answerOptionsResult.push(insertedAnswerOption);
              }
              questionsResult[i].answer_options = answerOptionsResult;
            }

            const returnObject = questionnaireResult;
            returnObject.questions = questionsResult;
            return returnObject;
          });
        });
    });
  }

  async function reviseQuestionnaire(questionnaire, id) {
    const csQuestions = new db.$config.pgp.helpers.ColumnSet(
      [
        'questionnaire_id',
        'questionnaire_version',
        'text',
        'position',
        'is_mandatory',
        'variable_name',
      ],
      { table: 'questions' }
    );

    return db.tx(async (t) => {
      let version = (await t.one(latestQuestionnaireVersionQuery, id)).version;
      version = parseInt(version || 1) + 1;

      // Insert questionnaire
      return t
        .one(
          'INSERT INTO questionnaires(id, version, study_id, name, type, no_questions, cycle_amount, cycle_unit, publish, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, notification_weekday, notification_interval, notification_interval_unit, activate_at_date, compliance_needed, expires_after_days, finalises_after_days, notify_when_not_filled, notify_when_not_filled_time, notify_when_not_filled_day, cycle_per_day, cycle_first_hour, keep_answers) VALUES ($1:csv) RETURNING *',
          [
            [
              id,
              version,
              questionnaire.study_id,
              questionnaire.name,
              questionnaire.type,
              questionnaire.questions.length,
              questionnaire.cycle_amount,
              questionnaire.cycle_unit,
              questionnaire.publish,
              questionnaire.activate_after_days,
              questionnaire.deactivate_after_days,
              questionnaire.notification_tries,
              questionnaire.notification_title,
              questionnaire.notification_body_new,
              questionnaire.notification_body_in_progress,
              questionnaire.notification_weekday,
              questionnaire.notification_interval,
              questionnaire.notification_interval_unit,
              questionnaire.activate_at_date
                ? questionnaire.activate_at_date
                : null,
              questionnaire.compliance_needed,
              questionnaire.expires_after_days
                ? questionnaire.expires_after_days
                : 5,
              questionnaire.finalises_after_days
                ? questionnaire.finalises_after_days
                : 2,
              questionnaire.notify_when_not_filled
                ? questionnaire.notify_when_not_filled
                : false,
              questionnaire.notify_when_not_filled_time
                ? questionnaire.notify_when_not_filled_time
                : null,
              questionnaire.notify_when_not_filled_day >= 0
                ? questionnaire.notify_when_not_filled_day
                : null,
              questionnaire.cycle_per_day ? questionnaire.cycle_per_day : null,
              questionnaire.cycle_first_hour
                ? questionnaire.cycle_first_hour
                : null,
              questionnaire.keep_answers,
            ],
          ]
        )
        .then(async (questionnaireResult) => {
          // Insert questions
          const vQuestions = [];
          questionnaire.questions.forEach(function (question) {
            vQuestions.push({
              questionnaire_id: questionnaireResult.id,
              questionnaire_version: questionnaireResult.version,
              text: question.text,
              position: question.position,
              is_mandatory: question.is_mandatory,
              variable_name: question.variable_name,
            });
          });
          const qQuestions =
            db.$config.pgp.helpers.insert(vQuestions, csQuestions) +
            'RETURNING *';

          return t.many(qQuestions).then(async function (questionsResult) {
            const formerAOId = {};

            // Insert answer options
            for (let i = 0; i < questionnaire.questions.length; i++) {
              const answerOptionsResult = [];
              for (
                let j = 0;
                j < questionnaire.questions[i].answer_options.length;
                j++
              ) {
                const curAnswerOption =
                  questionnaire.questions[i].answer_options[j];
                const insertedAnswerOption = await t.one(
                  'INSERT INTO answer_options(question_id, text, answer_type_id, values, values_code, position, restriction_min, restriction_max, is_decimal, variable_name, is_notable) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
                  [
                    questionsResult[i].id,
                    curAnswerOption.text,
                    curAnswerOption.answer_type_id,
                    curAnswerOption.values.map((value) => value.value),
                    curAnswerOption.values_code
                      ? curAnswerOption.values_code.map((value) => value.value)
                      : null,
                    curAnswerOption.position,
                    curAnswerOption.restriction_min,
                    curAnswerOption.restriction_max,
                    curAnswerOption.is_decimal,
                    curAnswerOption.variable_name,
                    curAnswerOption.is_notable
                      ? curAnswerOption.is_notable.map((value) => value.value)
                      : null,
                  ]
                );
                answerOptionsResult.push(insertedAnswerOption);
                if (curAnswerOption.id) {
                  formerAOId[curAnswerOption.id] = insertedAnswerOption.id;
                }
              }
              questionsResult[i].answer_options = answerOptionsResult;
            }

            // Insert conditions after the questionnaire was completely saved
            if (questionnaire.condition) {
              if (
                (await answerOptionExists(
                  t,
                  questionnaire.condition.condition_target_answer_option
                )) &&
                (await questionnaireIsActive(
                  t,
                  questionnaire.condition.condition_target_questionnaire,
                  questionnaire.condition.condition_target_questionnaire_version
                ))
              ) {
                questionnaireResult.condition = await insertCondition(
                  t,
                  questionnaire.condition,
                  {
                    condition_questionnaire_id: questionnaireResult.id,
                    condition_questionnaire_version:
                      questionnaireResult.version,
                  }
                );
              } else {
                questionnaireResult.condition = questionnaire.condition;
                questionnaireResult.condition.error = 404;
              }
            }

            for (let i = 0; i < questionnaire.questions.length; i++) {
              const curQuestion = questionnaire.questions[i];
              const questionCondition = questionnaire.questions[i].condition;
              if (questionCondition) {
                if (questionCondition.condition_type === 'external') {
                  if (
                    (await answerOptionExists(
                      t,
                      questionCondition.condition_target_answer_option
                    )) &&
                    (await questionnaireIsActive(
                      t,
                      questionCondition.condition_target_questionnaire,
                      questionCondition.condition_target_questionnaire_version
                    ))
                  ) {
                    questionsResult[i].condition = await insertCondition(
                      t,
                      questionCondition,
                      { condition_question_id: questionsResult[i].id }
                    );
                  } else {
                    questionsResult[i].condition = questionCondition;
                    questionsResult[i].condition.error = 404;
                  }
                } else {
                  const curCondition = curQuestion.condition;
                  if (
                    curCondition.condition_target_answer_option &&
                    formerAOId[curCondition.condition_target_answer_option]
                  ) {
                    curCondition.condition_target_answer_option =
                      formerAOId[curCondition.condition_target_answer_option];
                  } else if (
                    curCondition.condition_target_question_pos !== undefined &&
                    curCondition.condition_target_question_pos !== null &&
                    curCondition.condition_target_answer_option_pos !==
                      undefined &&
                    curCondition.condition_target_answer_option_pos !== null
                  ) {
                    const targetQuestionIdRes = await t.one(
                      'SELECT id FROM questions WHERE questionnaire_id = ${qId} AND questionnaire_version = ${qVersion} AND position = ${p}',
                      {
                        qId: questionnaireResult.id,
                        qVersion: questionnaireResult.version,
                        p: curCondition.condition_target_question_pos,
                      }
                    );
                    const targetQuestionId = targetQuestionIdRes.id;
                    const targetAnswerOptionIdRes = await t.one(
                      'SELECT id FROM answer_options WHERE question_id = ${qId} AND position = ${p}',
                      {
                        qId: targetQuestionId,
                        p: curCondition.condition_target_answer_option_pos,
                      }
                    );
                    const targetAnswerOptionId = targetAnswerOptionIdRes.id;
                    curCondition.condition_target_answer_option =
                      targetAnswerOptionId;
                  }
                  curCondition.condition_question_id = questionsResult[i].id;
                  curCondition.condition_target_questionnaire =
                    questionnaireResult.id;
                  curCondition.condition_target_questionnaire_version =
                    questionnaireResult.version;
                  questionsResult[i].condition = await insertCondition(
                    t,
                    curCondition,
                    { condition_question_id: questionsResult[i].id }
                  );
                }
              }
              const answerOptionsResult = [];
              for (let j = 0; j < curQuestion.answer_options.length; j++) {
                const curAnswerOption = curQuestion.answer_options[j];
                let insertedAnswerOption;
                insertedAnswerOption = questionsResult[i].answer_options.find(
                  function (answerOption) {
                    return answerOption.position === curAnswerOption.position;
                  }
                );
                if (curAnswerOption.condition) {
                  if (curAnswerOption.condition.condition_type === 'external') {
                    if (
                      (await answerOptionExists(
                        t,
                        curAnswerOption.condition.condition_target_answer_option
                      )) &&
                      (await questionnaireIsActive(
                        t,
                        curAnswerOption.condition
                          .condition_target_questionnaire,
                        curAnswerOption.condition
                          .condition_target_questionnaire_version
                      ))
                    ) {
                      curAnswerOption.condition = await insertCondition(
                        t,
                        curAnswerOption.condition,
                        { condition_answer_option_id: insertedAnswerOption.id }
                      );
                    } else {
                      insertedAnswerOption.condition =
                        curAnswerOption.condition;
                      insertedAnswerOption.condition.error = 404;
                    }
                    insertedAnswerOption = curAnswerOption;
                  } else {
                    const curCondition = curAnswerOption.condition;
                    if (
                      curCondition.condition_target_answer_option &&
                      formerAOId[curCondition.condition_target_answer_option]
                    ) {
                      curCondition.condition_target_answer_option =
                        formerAOId[curCondition.condition_target_answer_option];
                    } else if (
                      curCondition.condition_target_question_pos !==
                        undefined &&
                      curCondition.condition_target_question_pos !== null &&
                      curCondition.condition_target_answer_option_pos !==
                        undefined &&
                      curCondition.condition_target_answer_option_pos !== null
                    ) {
                      const targetQuestionIdRes = await t.one(
                        'SELECT id FROM questions WHERE questionnaire_id = ${qId} AND questionnaire_version = ${qVersion} AND position = ${p}',
                        {
                          qId: questionnaireResult.id,
                          qVersion: questionnaireResult.version,
                          p: curCondition.condition_target_question_pos,
                        }
                      );
                      const targetQuestionId = targetQuestionIdRes.id;
                      const targetAnswerOptionIdRes = await t.one(
                        'SELECT id FROM answer_options WHERE question_id = ${qId} AND position = ${p}',
                        {
                          qId: targetQuestionId,
                          p: curCondition.condition_target_answer_option_pos,
                        }
                      );
                      const targetAnswerOptionId = targetAnswerOptionIdRes.id;
                      curCondition.condition_target_answer_option =
                        targetAnswerOptionId;
                    }
                    curCondition.condition_answer_option_id =
                      insertedAnswerOption.id;
                    curCondition.condition_target_questionnaire =
                      questionnaireResult.id;
                    curCondition.condition_target_questionnaire_version =
                      questionnaireResult.version;
                    insertedAnswerOption.condition = await insertCondition(
                      t,
                      curCondition,
                      { condition_answer_option_id: insertedAnswerOption.id }
                    );
                  }
                }
                answerOptionsResult.push(insertedAnswerOption);
              }
              questionsResult[i].answer_options = answerOptionsResult;
            }

            const returnObject = questionnaireResult;
            returnObject.questions = questionsResult;
            return returnObject;
          });
        });
    });
  }

  async function updateQuestionnaire(questionnaire, id, version) {
    return db.tx(async (t) => {
      if (!version) {
        version = (await t.one(latestQuestionnaireVersionQuery, id)).version;
      }

      await t.none(
        'DELETE FROM user_files WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE questionnaire_id=$1 AND questionnaire_version=$2)',
        [id, version]
      );

      // Delete answers for now so that the customer can test questionnaire creation easier
      return t
        .none(
          'DELETE FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE questionnaire_id=$1 AND questionnaire_version=$2)',
          [id, version]
        )
        .then(async function () {
          // Update questionnaire
          return t
            .one(
              'UPDATE questionnaires SET study_id=$1, name=$2, type=$3, no_questions=$4, cycle_amount=$5, cycle_unit=$6, publish=$25, activate_after_days=$7, deactivate_after_days=$8, notification_tries=$9, notification_title=$10, notification_body_new=$11, notification_body_in_progress=$12, notification_weekday=$13, notification_interval=$14, notification_interval_unit=$15, activate_at_date=$16, compliance_needed=$17, expires_after_days=$18, finalises_after_days=$19, notify_when_not_filled=$22, notify_when_not_filled_time=$23, notify_when_not_filled_day=$24, cycle_per_day=$26, cycle_first_hour=$27, keep_answers=$28 WHERE id=$20 AND version=$21 RETURNING *',
              [
                questionnaire.study_id,
                questionnaire.name,
                questionnaire.type,
                questionnaire.questions.length,
                questionnaire.cycle_amount,
                questionnaire.cycle_unit,
                questionnaire.activate_after_days,
                questionnaire.deactivate_after_days,
                questionnaire.notification_tries,
                questionnaire.notification_title,
                questionnaire.notification_body_new,
                questionnaire.notification_body_in_progress,
                questionnaire.notification_weekday,
                questionnaire.notification_interval,
                questionnaire.notification_interval_unit,
                questionnaire.activate_at_date
                  ? questionnaire.activate_at_date
                  : null,
                questionnaire.compliance_needed,
                questionnaire.expires_after_days
                  ? questionnaire.expires_after_days
                  : 5,
                questionnaire.finalises_after_days
                  ? questionnaire.finalises_after_days
                  : 2,
                id,
                version,
                questionnaire.notify_when_not_filled
                  ? questionnaire.notify_when_not_filled
                  : false,
                questionnaire.notify_when_not_filled_time
                  ? questionnaire.notify_when_not_filled_time
                  : null,
                questionnaire.notify_when_not_filled_day >= 0
                  ? questionnaire.notify_when_not_filled_day
                  : null,
                questionnaire.publish,
                questionnaire.cycle_per_day
                  ? questionnaire.cycle_per_day
                  : null,
                questionnaire.cycle_first_hour
                  ? questionnaire.cycle_first_hour
                  : null,
                questionnaire.keep_answers,
              ]
            )
            .then(async (questionnaireResult) => {
              // Update condition for questionnaire
              await t.oneOrNone(
                'DELETE FROM conditions WHERE condition_questionnaire_id = ${id} AND condition_questionnaire_version = ${version} RETURNING condition_target_answer_option',
                {
                  id: questionnaireResult.id,
                  version: questionnaireResult.version,
                }
              );
              questionnaireResult.condition = await insertCondition(
                t,
                questionnaire.condition,
                {
                  condition_questionnaire_id: questionnaireResult.id,
                  condition_questionnaire_version: questionnaireResult.version,
                }
              );

              const oldQuestions = await t.many(
                'SELECT id FROM questions WHERE questionnaire_id=${id} AND questionnaire_version=${version}',
                {
                  id: questionnaireResult.id,
                  version: questionnaireResult.version,
                }
              );
              const oldAnswerOptions = await t.manyOrNone(
                'SELECT * FROM answer_options WHERE question_id=ANY(SELECT id FROM questions WHERE questionnaire_id=${id} AND questionnaire_version=${version})',
                {
                  id: questionnaireResult.id,
                  version: questionnaireResult.version,
                }
              );
              const newQuestions = questionnaire.questions;
              let newAnswerOptions = [];
              const newQuestionsResult = [];
              const newAnswerOptionsResult = [];
              for (let i = 0; i < questionnaire.questions.length; i++) {
                questionnaire.questions[i].answer_options.forEach(function (
                  answer_option
                ) {
                  answer_option.question_id = questionnaire.questions[i].id;
                });
                newAnswerOptions = newAnswerOptions.concat(
                  questionnaire.questions[i].answer_options
                );
              }

              // Compare new and old answer_options and insert/update/delete answer_options
              for (let i = 0; i < oldAnswerOptions.length; i++) {
                const curOldAnswerOption = oldAnswerOptions[i];
                let foundAnswerOption = null;
                let isConditionBreakingUpdate = false;
                for (let j = 0; j < newAnswerOptions.length; j++) {
                  const curNewAnswerOption = newAnswerOptions[j];
                  if (curOldAnswerOption.id === curNewAnswerOption.id) {
                    foundAnswerOption = curNewAnswerOption;
                    if (
                      JSON.stringify(
                        foundAnswerOption.values.map((value) => value.value)
                      ) !== JSON.stringify(curOldAnswerOption.values) ||
                      foundAnswerOption.answer_type_id !==
                        curOldAnswerOption.answer_type_id
                    ) {
                      isConditionBreakingUpdate = true;
                    }
                    newAnswerOptions.splice(j, 1);
                    break;
                  }
                }
                if (foundAnswerOption !== null) {
                  if (isConditionBreakingUpdate) {
                    await t.none(
                      'DELETE FROM conditions WHERE condition_target_answer_option = ${id}',
                      { id: curOldAnswerOption.id }
                    );
                  }

                  const newAnswerOptionResult = await t.one(
                    'UPDATE answer_options SET text=$1, answer_type_id=$2, values=$3, values_code=$4, position=$5, restriction_min=$7, restriction_max=$8, is_decimal=$9, variable_name=$10, is_notable=$12 WHERE id=$11 RETURNING *',
                    [
                      foundAnswerOption.text,
                      foundAnswerOption.answer_type_id,
                      foundAnswerOption.values.map((value) => value.value),
                      foundAnswerOption.values_code
                        ? foundAnswerOption.values_code.map(
                            (value) => value.value
                          )
                        : null,
                      foundAnswerOption.position,
                      false,
                      foundAnswerOption.restriction_min,
                      foundAnswerOption.restriction_max,
                      foundAnswerOption.is_decimal,
                      foundAnswerOption.variable_name,
                      curOldAnswerOption.id,
                      foundAnswerOption.is_notable
                        ? foundAnswerOption.is_notable.map(
                            (value) => value.value
                          )
                        : null,
                    ]
                  );

                  await t.oneOrNone(
                    'DELETE FROM conditions WHERE condition_answer_option_id = ${id} RETURNING condition_target_answer_option',
                    { id: curOldAnswerOption.id }
                  );
                  newAnswerOptionResult.condition = await insertCondition(
                    t,
                    foundAnswerOption.condition,
                    { condition_answer_option_id: newAnswerOptionResult.id }
                  );
                  newAnswerOptionsResult.push(newAnswerOptionResult);
                } else {
                  await t.oneOrNone(
                    'DELETE FROM conditions WHERE condition_answer_option_id = ${id} RETURNING *',
                    { id: curOldAnswerOption.id }
                  );
                  await t.none(
                    'DELETE FROM conditions WHERE condition_target_answer_option = ${id}',
                    { id: curOldAnswerOption.id }
                  );
                  await t.none('DELETE FROM answer_options WHERE id=$1', [
                    curOldAnswerOption.id,
                  ]);
                }
              }
              for (let i = 0; i < newAnswerOptions.length; i++) {
                if (
                  newAnswerOptions[i].question_id !== undefined &&
                  newAnswerOptions[i].question_id !== 0
                ) {
                  const newAnswerOptionResult = await t.one(
                    'INSERT INTO answer_options(question_id, text, answer_type_id, values, values_code, position, restriction_min, restriction_max, is_decimal, variable_name, is_notable) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
                    [
                      newAnswerOptions[i].question_id,
                      newAnswerOptions[i].text,
                      newAnswerOptions[i].answer_type_id,
                      newAnswerOptions[i].values.map((value) => value.value),
                      newAnswerOptions[i].values_code
                        ? newAnswerOptions[i].values_code.map(
                            (value) => value.value
                          )
                        : null,
                      newAnswerOptions[i].position,
                      newAnswerOptions[i].restriction_min,
                      newAnswerOptions[i].restriction_max,
                      newAnswerOptions[i].is_decimal,
                      newAnswerOptions[i].variable_name,
                      newAnswerOptions[i].is_notable.map(
                        (value) => value.value
                      ),
                    ]
                  );
                  newAnswerOptionResult.condition = await insertCondition(
                    t,
                    newAnswerOptions[i].condition,
                    { condition_answer_option_id: newAnswerOptionResult.id }
                  );
                  newAnswerOptionsResult.push(newAnswerOptionResult);
                }
              }

              // Compare new and old questions and insert/update/delete questions
              for (let i = 0; i < oldQuestions.length; i++) {
                const curOldQuestion = oldQuestions[i];
                let foundQuestion = null;
                for (let j = 0; j < newQuestions.length; j++) {
                  const curNewQuestion = newQuestions[j];
                  if (curOldQuestion.id === curNewQuestion.id) {
                    foundQuestion = curNewQuestion;
                    newQuestions.splice(j, 1);
                    break;
                  }
                }
                if (foundQuestion !== null) {
                  const newQuestionResult = await t.one(
                    'UPDATE questions SET text=$1, position=$2, is_mandatory=$3, variable_name=$4 WHERE id=$5 RETURNING *',
                    [
                      foundQuestion.text,
                      foundQuestion.position,
                      foundQuestion.is_mandatory,
                      foundQuestion.variable_name,
                      curOldQuestion.id,
                    ]
                  );
                  await t.oneOrNone(
                    'DELETE FROM conditions WHERE condition_question_id = ${id} RETURNING condition_target_answer_option',
                    { id: foundQuestion.id }
                  );
                  newQuestionResult.condition = await insertCondition(
                    t,
                    foundQuestion.condition,
                    { condition_question_id: newQuestionResult.id }
                  );
                  newQuestionsResult.push(newQuestionResult);
                } else {
                  await t.oneOrNone(
                    'DELETE FROM conditions WHERE condition_question_id = ${id} RETURNING condition_target_answer_option',
                    { id: curOldQuestion.id }
                  );
                  await t.none('DELETE FROM questions WHERE id=$1', [
                    curOldQuestion.id,
                  ]);
                }
              }
              for (let i = 0; i < newQuestions.length; i++) {
                const newQuestionResult = await t.one(
                  'INSERT INTO questions(questionnaire_id, text, position, is_mandatory, variable_name, questionnaire_version) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
                  [
                    id,
                    newQuestions[i].text,
                    newQuestions[i].position,
                    newQuestions[i].is_mandatory,
                    newQuestions[i].variable_name,
                    version,
                  ]
                );
                const newAnswerOptionsInNewQuestion =
                  newQuestions[i].answer_options;
                for (let j = 0; j < newAnswerOptionsInNewQuestion.length; j++) {
                  const newAnswerOptionInNewQuestionResult = await t.one(
                    'INSERT INTO answer_options(question_id, text, answer_type_id, values, values_code, position, restriction_min, restriction_max, is_decimal, variable_name, is_notable) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
                    [
                      newQuestionResult.id,
                      newAnswerOptionsInNewQuestion[j].text,
                      newAnswerOptionsInNewQuestion[j].answer_type_id,
                      newAnswerOptionsInNewQuestion[j].values.map(
                        (value) => value.value
                      ),
                      newAnswerOptionsInNewQuestion[j].values_code
                        ? newAnswerOptionsInNewQuestion[j].values_code.map(
                            (value) => value.value
                          )
                        : null,
                      newAnswerOptionsInNewQuestion[j].position,
                      newAnswerOptionsInNewQuestion[j].restriction_min,
                      newAnswerOptionsInNewQuestion[j].restriction_max,
                      newAnswerOptionsInNewQuestion[j].is_decimal,
                      newAnswerOptionsInNewQuestion[j].variable_name,
                      newAnswerOptionsInNewQuestion[j].is_notable
                        ? newAnswerOptionsInNewQuestion[j].is_notable.map(
                            (value) => value.value
                          )
                        : null,
                    ]
                  );
                  newAnswerOptionInNewQuestionResult.condition =
                    await insertCondition(
                      t,
                      newAnswerOptionsInNewQuestion[j].condition,
                      {
                        condition_answer_option_id:
                          newAnswerOptionInNewQuestionResult.id,
                      }
                    );
                  newAnswerOptionsResult.push(
                    newAnswerOptionInNewQuestionResult
                  );
                }
                newQuestionResult.condition = await insertCondition(
                  t,
                  newQuestions[i].condition,
                  { condition_question_id: newQuestionResult.id }
                );
                newQuestionsResult.push(newQuestionResult);
              }

              const returnObject = questionnaireResult;
              returnObject.questions = newQuestionsResult;
              returnObject.questions.forEach(function (question) {
                question.answer_options = [];
                newAnswerOptionsResult.forEach(function (answerOption) {
                  if (answerOption.question_id === question.id) {
                    question.answer_options.push(answerOption);
                  }
                });
              });
              return returnObject;
            });
        });
    });
  }

  async function deleteQuestionnaire(id, version) {
    return db.tx(async (t) => {
      if (!version) {
        version = (await t.one(latestQuestionnaireVersionQuery, id)).version;
      }
      const questionnaire = { qId: id, qVersion: version };

      await t.none(
        "DELETE FROM notification_schedules WHERE notification_type='qReminder' AND reference_id::integer=ANY(SELECT id FROM questionnaire_instances WHERE questionnaire_id=${qId} AND questionnaire_version=${qVersion})",
        questionnaire
      );

      await t.none(
        'DELETE FROM user_files WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE questionnaire_id=${qId} AND questionnaire_version=${qVersion})',
        questionnaire
      );

      // Delete all answers when deleting the questionnaire
      await t.none(
        'DELETE FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE questionnaire_id=${qId} AND questionnaire_version=${qVersion})',
        questionnaire
      );

      await t.none(
        'DELETE FROM questionnaire_instances_queued WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE questionnaire_id=${qId} AND questionnaire_version=${qVersion})',
        questionnaire
      );
      await t.none(
        'DELETE FROM questionnaire_instances WHERE questionnaire_id=${qId} AND questionnaire_version=${qVersion}',
        questionnaire
      );

      await t.none(
        'DELETE FROM conditions WHERE condition_questionnaire_id=${qId} AND condition_questionnaire_version=${qVersion}',
        questionnaire
      );
      await t.none(
        'DELETE FROM conditions WHERE condition_question_id=ANY(SELECT id FROM questions WHERE questionnaire_id=${qId} AND questionnaire_version=${qVersion})',
        questionnaire
      );
      await t.none(
        'DELETE FROM conditions WHERE condition_answer_option_id=ANY(SELECT id FROM answer_options WHERE question_id=ANY(SELECT id FROM questions WHERE questionnaire_id=${qId} AND questionnaire_version=${qVersion}))',
        questionnaire
      );

      await t.none(
        'DELETE FROM answer_options WHERE question_id=ANY(SELECT id FROM questions WHERE questionnaire_id=${qId} AND questionnaire_version=${qVersion})',
        questionnaire
      );
      await t.none(
        'DELETE FROM questions WHERE questionnaire_id=${qId} AND questionnaire_version=${qVersion}',
        questionnaire
      );
      await t.none(
        'DELETE FROM questionnaires WHERE id=${qId} AND version=${qVersion}',
        questionnaire
      );
      return;
    });
  }

  async function getStudyAccessForUser(study_id, user_id) {
    return db.one(
      'SELECT * FROM study_users WHERE study_id=${study_id} AND user_id=${user_id}',
      { study_id: study_id, user_id: user_id }
    );
  }

  async function getStudy(id, columns) {
    return db.one('SELECT ${columns:name} FROM studies WHERE name=${id}', {
      id: id,
      columns: columns,
    });
  }

  async function getStudyAddresses(studyNames) {
    return db.manyOrNone(
      'SELECT address, name FROM studies WHERE name IN($1:csv) AND address IS NOT NULL',
      [studyNames]
    );
  }

  async function getStudyWelcomeText(study_id, language = 'de_DE') {
    return db.oneOrNone(
      'SELECT * FROM study_welcome_text WHERE study_id = $1 AND language=$2',
      [study_id, language]
    );
  }

  async function createOrUpdateAnswers(
    qInstanceId,
    answers,
    version,
    date_of_release,
    releasing_person
  ) {
    return db.tx(async (t) => {
      return t
        .manyOrNone(
          'SELECT * FROM answers WHERE questionnaire_instance_id=${qInstanceId} AND versioning=${version}',
          { qInstanceId: qInstanceId, version: version }
        )
        .then(async function (oldAnswersResult) {
          const csUpdateAnswers = new db.$config.pgp.helpers.ColumnSet(
            [
              '?questionnaire_instance_id',
              '?question_id',
              '?answer_option_id',
              '?versioning',
              'value',
              { name: 'date_of_release', cast: 'timestamp' },
              'releasing_person',
            ],
            { table: 'answers' }
          );
          const csCreateAnswers = new db.$config.pgp.helpers.ColumnSet(
            [
              'questionnaire_instance_id',
              'question_id',
              'answer_option_id',
              'versioning',
              'value',
              { name: 'date_of_release', cast: 'timestamp' },
              'releasing_person',
            ],
            { table: 'answers' }
          );

          const vUpdateAnswers = [];
          const vCreateAnswers = [];
          let qUpdateAnswers = null;
          let qInsertAnswers = null;

          // Extract ids of the answer option
          const answer_option_ids = answers.map((el) => el.answer_option_id);

          const answer_option_ids_type_image_and_file = await t.manyOrNone(
            'SELECT id FROM answer_options WHERE (answer_type_id=8 OR answer_type_id=10) AND id IN ($1:list)',
            [answer_option_ids]
          );

          const user_idObj = await t.one(
            'SELECT user_id FROM questionnaire_instances WHERE id=$1',
            [qInstanceId]
          );

          const user_id = user_idObj.user_id;

          for (const answer of answers) {
            const isAnswerTypeEqualImage =
              answer_option_ids_type_image_and_file.find(
                (element) => element.id === answer.answer_option_id
              );

            const foundOne = oldAnswersResult.find(function (oldAnswer) {
              return (
                answer.question_id === oldAnswer.question_id &&
                answer.answer_option_id === oldAnswer.answer_option_id
              );
            });

            if (foundOne) {
              // Check if the answer of type image
              if (
                isAnswerTypeEqualImage !== undefined &&
                (isNaN(answer.value) || answer.value === '')
              ) {
                if (foundOne.value !== '') {
                  // Answer of type  get special treatment
                  // Delete old image, only if it is not referenced by other answer version
                  const foundReferences = await t.manyOrNone(
                    'SELECT * FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2 AND value = $3 AND versioning != $4',
                    [
                      answer.questionnaire_instance_id,
                      answer.answer_option_id,
                      foundOne.value,
                      version,
                    ]
                  );
                  if (foundReferences.length == 0) {
                    await t.any('DELETE FROM user_files WHERE id=$1', [
                      foundOne.value,
                    ]);
                  }
                }

                if (answer.value !== '') {
                  const { file_name, data } = JSON.parse(answer.value);

                  // Save image in the separated table and save id as answer value
                  const fileId = await t.one(
                    'INSERT INTO user_files(user_id, questionnaire_instance_id, answer_option_id, file, file_name) VALUES ($1:csv) RETURNING id',
                    [
                      [
                        user_id,
                        qInstanceId,
                        answer.answer_option_id,
                        data,
                        file_name,
                      ],
                    ]
                  );
                  answer.value = fileId.id.toString();
                }
              }
              vUpdateAnswers.push({
                questionnaire_instance_id: qInstanceId,
                question_id: answer.question_id,
                answer_option_id: answer.answer_option_id,
                versioning: version,
                value: answer.value,
                date_of_release: date_of_release ?? null,
                releasing_person: releasing_person ?? null,
              });
            } else {
              if (
                isAnswerTypeEqualImage &&
                isNaN(answer.value) &&
                answer.value !== ''
              ) {
                const { file_name, data } = JSON.parse(answer.value);
                // Save image in a separated table and save the id as answer value
                const fileId = await t.one(
                  'INSERT INTO user_files(user_id, questionnaire_instance_id, answer_option_id, file, file_name) VALUES ($1:csv) RETURNING id',
                  [
                    [
                      user_id,
                      qInstanceId,
                      answer.answer_option_id,
                      data,
                      file_name,
                    ],
                  ]
                );
                answer.value = fileId.id.toString();
              }
              vCreateAnswers.push({
                questionnaire_instance_id: qInstanceId,
                question_id: answer.question_id,
                answer_option_id: answer.answer_option_id,
                versioning: version,
                value: answer.value,
                date_of_release: date_of_release ?? null,
                releasing_person: releasing_person ?? null,
              });
            }
          }

          if (vUpdateAnswers.length > 0) {
            qUpdateAnswers =
              db.$config.pgp.helpers.update(vUpdateAnswers, csUpdateAnswers) +
              ' WHERE v.questionnaire_instance_id = t.questionnaire_instance_id ' +
              'AND v.question_id = t.question_id ' +
              'AND v.answer_option_id = t.answer_option_id ' +
              'AND v.versioning = t.versioning RETURNING *';
          }
          if (vCreateAnswers.length > 0) {
            qInsertAnswers =
              db.$config.pgp.helpers.insert(vCreateAnswers, csCreateAnswers) +
              'RETURNING *';
          }

          if (qUpdateAnswers) {
            return t.many(qUpdateAnswers).then(function (updatedResult) {
              if (qInsertAnswers) {
                return t.many(qInsertAnswers).then(function (insertedResult) {
                  return updatedResult.concat(insertedResult);
                });
              } else return updatedResult;
            });
          } else if (qInsertAnswers) {
            return t.many(qInsertAnswers).then(function (insertedResult) {
              return insertedResult;
            });
          }
        });
    });
  }

  async function getAnswersForProband(id) {
    return db
      .oneOrNone(
        'SELECT versioning FROM answers WHERE questionnaire_instance_id=$(id) ORDER BY versioning DESC LIMIT 1',
        { id: id }
      )
      .then(async function (version) {
        return db.manyOrNone(
          'SELECT * FROM answers WHERE questionnaire_instance_id=$(id) AND versioning=$(version)',
          { id: id, version: version ? version.versioning : 1 }
        );
      });
  }

  async function getHistoricalAnswersForInstance(id) {
    return db
      .manyOrNone(
        'SELECT answer_option_id, answers.question_id, versioning, value, date_of_release, releasing_person, answer_type_id FROM answers, answer_options ' +
          'WHERE questionnaire_instance_id=${id} AND answer_options.id=answers.answer_option_id ORDER BY versioning, question_id, answer_option_id',
        { id: id }
      )
      .then(async function (result) {
        return db
          .manyOrNone(
            'SELECT * FROM user_files WHERE questionnaire_instance_id=$1',
            [id]
          )
          .then(function (files) {
            if (result && result.length > 0 && files && files.length > 0) {
              result.find((answer) => {
                if (
                  answer.answer_type_id === 8 ||
                  answer.answer_type_id === 10
                ) {
                  const file = files.find((file) => {
                    return file.id === parseInt(answer.value);
                  });
                  if (file && file.file_name) {
                    answer.value = file.file_name;
                  }
                }
              });
            }
            return result;
          });
      });
  }

  async function getAllQueuesForProband(user_id) {
    return db.manyOrNone(
      'SELECT * FROM questionnaire_instances_queued WHERE user_id=$1 ORDER BY date_of_queue DESC',
      [user_id]
    );
  }

  async function deleteQueue(user_id, instance_id) {
    // one() is used here in order to get an error, if nothing was deleted
    await db.one(
      'DELETE FROM questionnaire_instances_queued WHERE user_id=$1 AND questionnaire_instance_id=$2 RETURNING *',
      [user_id, instance_id]
    );
  }

  async function getAnswersForForscher(id) {
    return db
      .oneOrNone(
        'SELECT versioning FROM answers WHERE questionnaire_instance_id=${id} ORDER BY versioning DESC LIMIT 1',
        { id: id }
      )
      .then(async function (version) {
        return db
          .manyOrNone(
            'SELECT * FROM answers WHERE questionnaire_instance_id=${id} AND versioning=${version}',
            { id: id, version: version ? version.versioning : 1 }
          )
          .then(function (result_v2) {
            if (result_v2.length === 0) {
              return db.manyOrNone(
                'SELECT * FROM answers WHERE questionnaire_instance_id=${id} AND versioning=${version}',
                { id: id, version: 1 }
              );
            } else {
              return result_v2;
            }
          });
      });
  }

  async function deleteAnswer(
    questionnaire_instance_id,
    answer_option_id,
    version
  ) {
    return db.tx(async (t) => {
      if (!version) {
        const maxVersionResult = await t.one(
          'SELECT MAX(versioning) AS max FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2',
          [questionnaire_instance_id, answer_option_id]
        );
        version = maxVersionResult.max;
      }
      const answer_option = await t.one(
        'SELECT * FROM answer_options WHERE id=$1',
        [answer_option_id]
      );

      if (
        answer_option.answer_type_id === 8 ||
        answer_option.answer_type_id === 10
      ) {
        const fileId = await t.one(
          'SELECT value FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2 AND versioning=$3',
          [questionnaire_instance_id, answer_option_id, version]
        );

        if (fileId.value !== '') {
          const foundReferences = await t.manyOrNone(
            'SELECT * FROM answers WHERE questionnaire_instance_id=$1 AND answer_option_id=$2 AND value = $3 AND versioning != $4',
            [questionnaire_instance_id, answer_option_id, fileId.value, version]
          );
          if (foundReferences.length === 0) {
            await t.any('DELETE FROM user_files WHERE id=$1', [fileId.value]);
          }
        }
      }

      await t.none(
        'UPDATE answers SET value=${empty} WHERE questionnaire_instance_id=${questionnaire_instance_id} AND answer_option_id=${answer_option_id} AND versioning=${version}',
        {
          empty: '',
          questionnaire_instance_id: questionnaire_instance_id,
          answer_option_id: answer_option_id,
          version: version,
        }
      );
    });
  }

  function createQueryStream(query, queryParameter) {
    const qs = new QueryStream(pgp.as.format(query, queryParameter));
    db.stream(qs, () => {
      // This callback is not required by us - but it is checked by the function!
    });
    return qs;
  }

  function streamAnswers(
    questionnaires,
    probands,
    start_date,
    end_date,
    study_name
  ) {
    let questionnaireTuples = '';
    if (questionnaires) {
      questionnaireTuples = questionnaires
        .map((q) => `(${+q.id},${+q.version})`)
        .join(',');
    }

    const query = `SELECT qi.questionnaire_name,
                          qi.questionnaire_version,
                          qi.user_id,
                          qi.date_of_release_v1,
                          qi.date_of_release_v2,
                          qi.date_of_issue,
                          qi.status,
                          quest.variable_name       AS question_variable_name,
                          quest.position    AS qposition,
                          ao.variable_name          AS answer_option_variable_name,
                          ao.position       AS aposition,
                          ao.values,
                          ao.values_code,
                          ao.answer_type_id AS a_type,
                          a.versioning,
                          a.value,
                          a.date_of_release,
                          p.ids
                   FROM questionnaires AS q
                          JOIN questions AS quest
                               ON quest.questionnaire_id = q.id AND quest.questionnaire_version = q.version
                          JOIN answer_options AS ao
                               ON ao.question_id = quest.id
                          JOIN questionnaire_instances AS qi
                               ON q.id = qi.questionnaire_id AND q.version = qi.questionnaire_version
                          LEFT OUTER JOIN probands AS p
                               ON qi.user_id = p.pseudonym
                          LEFT OUTER JOIN answers AS a
                                          ON ao.id = a.answer_option_id AND
                                             qi.id = a.questionnaire_instance_id AND
                                             (qi.status = 'released_once' OR
                                              qi.status = 'released_twice' OR
                                              qi.status = 'released' OR
                                              (qi.status = 'in_progress' AND q.type = 'for_research_team'))
                   WHERE q.study_id = $(study_name)
                     AND (qi.questionnaire_id, qi.questionnaire_version) IN ($(questionnaireTuples:raw))
                     AND qi.user_id IN ($(probands:csv))
                     AND qi.status != 'inactive'
                     AND qi.date_of_issue >= $(start_date)
                     AND qi.date_of_issue <= $(end_date)
                   ORDER BY questionnaire_name, questionnaire_version, user_id, date_of_issue, qposition, aposition,
                            versioning`;
    return createQueryStream(query, {
      questionnaireTuples,
      probands,
      start_date,
      end_date,
      study_name,
    });
  }

  function streamLabResults(probands, start_date, end_date) {
    const query = `SELECT lr.user_id,
                              lr.order_id,
                              lr.performing_doctor,
                              lo.lab_result_id,
                              lo.name_id,
                              lo.name,
                              lo.result_value,
                              lo.comment,
                              lo.date_of_analysis,
                              lo.date_of_delivery,
                              lr.date_of_sampling,
                              lo.date_of_announcement,
                              lo.result_string,
                              p.ids
                       FROM lab_results AS lr
                                LEFT JOIN lab_observations AS lo ON lr.id = lo.lab_result_id
                                LEFT OUTER JOIN probands AS p ON lr.user_id = p.pseudonym
                       WHERE lr.status = 'analyzed'
                         AND lr.user_id IN ($(probands:csv))
                         AND lr.date_of_sampling >= $(start_date)
                         AND lr.date_of_sampling <= $(end_date)
                       ORDER BY lo.lab_result_id, lo.name_id `;
    return createQueryStream(query, {
      probands,
      start_date,
      end_date,
    });
  }

  function streamSamples(probands) {
    const query = `SELECT lr.id, lr.user_id, lr.status, lr.remark, lr.dummy_sample_id, lr.study_status, p.ids
                   FROM lab_results AS lr
                          LEFT OUTER JOIN probands AS p ON lr.user_id = p.pseudonym
                   WHERE lr.user_id IN ($(probands:csv))
                   ORDER BY lr.user_id, lr.id, lr.study_status, lr.status`;
    return createQueryStream(query, {
      probands,
    });
  }

  function streamBloodSamples(probands) {
    const query = `SELECT bs.sample_id, bs.user_id, bs.remark, bs.blood_sample_carried_out, p.ids
         FROM blood_samples AS bs
                LEFT OUTER JOIN probands AS p ON bs.user_id = p.pseudonym
         WHERE bs.user_id IN ($(probands:csv))
         ORDER BY bs.user_id, bs.sample_id`;
    return createQueryStream(query, {
      probands,
    });
  }

  function streamSettings(probands) {
    const query = `SELECT pseudonym,
                compliance_labresults,
                compliance_samples,
                compliance_bloodsamples,
                is_test_proband,
                ids
         FROM probands
         WHERE pseudonym IN ($(probands:csv))`;
    return createQueryStream(query, {
      probands,
    });
  }

  function streamFiles(fileIDs) {
    const query = 'SELECT * FROM user_files WHERE id IN ($(fileIDs:csv))';
    return createQueryStream(query, {
      fileIDs,
    });
  }

  async function getFileBy(id) {
    return await db.oneOrNone('SELECT * FROM user_files WHERE id=$1', [id]);
  }

  async function getAnswerOptionsWithTypes(answerOptionIDs) {
    return await db.manyOrNone(
      'SELECT id, answer_type_id FROM answer_options WHERE id IN ($1:csv)',
      [answerOptionIDs]
    );
  }

  return {
    /**
     * @function
     * @description inserts a new questionnaire
     * @memberof module:postgresqlHelper
     * @param {object} questionnaire the questionnaire object to insert
     * @returns {Promise} a resolved promise with the inserted questionnaire or a rejected promise with the error
     */
    insertQuestionnaire: insertQuestionnaire,

    /**
     * @function
     * @description updates the questionnaire with the specified id
     * @memberof module:postgresqlHelper
     * @param {object} questionnaire the questionnaire object to update
     * @returns {Promise} a resolved promise with the updated questionnaire or a rejected promise with the error
     */
    updateQuestionnaire: updateQuestionnaire,

    /**
     * @function
     * @description revises the questionnaire with the specified id
     * @memberof module:postgresqlHelper
     * @param {object} questionnaire the questionnaire object of new version
     * @param {number} id the id of the questionnaire to revise
     * @returns {Promise} a resolved promise with the revised questionnaire or a rejected promise with the error
     */
    reviseQuestionnaire: reviseQuestionnaire,

    /**
     * @function
     * @description deletes the questionnaire with the specified id
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the questionnaire to delete
     * @returns {Promise} a resolved promise or a rejected promise with the error
     */
    deleteQuestionnaire: deleteQuestionnaire,

    /**
     * @function
     * @description gets the study access for the given study and user
     * @memberof module:postgresqlHelper
     * @param {string} study_id the id of the study to find
     * @param {string} user_id the id of the user to find
     * @returns {Promise} a resolved promise with the found access level or a rejected promise with the error
     */
    getStudyAccessForUser: getStudyAccessForUser,

    /**
     * @function
     * @description updates the study Access with the specified id
     * @memberof module:postgresqlHelper
     * @param {string} study_id the study_id of the access to update
     * @returns {Promise} a resolved promise with the updated study access or a rejected promise with the error
     */
    getStudyWelcomeText: getStudyWelcomeText,

    /**
     * @function
     * @description gets the study with the specified id
     * @memberof module:postgresqlHelper
     * @param {string} id the id of the study to find
     * @param {(string[])} fields fields to fetch
     * @returns {Promise} a resolved promise with the found study or a rejected promise with the error
     */
    getStudy: getStudy,

    /**
     * @function
     * @description creates or updates answers for a questionnaire instance
     * @memberof module:postgresqlHelper
     * @param {number} qInstanceId the id of the questionnaire instance to create or update answers for
     * @param {array} answers the array of answers to create or update
     * @param {number} version the version of the answers to post, 1 or 2
     * @param {string | undefined} date_of_release
     * @param {string | undefined} releasing_person
     * @returns {Promise} a resolved promise with the created or updated answers or a rejected promise with the error
     */
    createOrUpdateAnswers: createOrUpdateAnswers,

    /**
     * @function
     * @description gets the answers for the questionnaire instance with id for a Proband (v2 if existing, v1 else)
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the questionnaire instance to get answers for
     * @returns {Promise} a resolved promise with the found answers or a rejected promise with the error
     */
    getAnswersForProband: getAnswersForProband,

    /**
     * @function
     * @description gets the historical answers for the questionnaire instance with id for a Proband (v2 if existing, v1 else)
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the questionnaire instance to get answers for
     * @returns {Promise} a resolved promise with the found answers or a rejected promise with the error
     */
    getHistoricalAnswersForInstance: getHistoricalAnswersForInstance,

    /**
     * @function
     * @description gets the instance queues for the proband
     * @memberof module:postgresqlHelper
     * @param {string} username the id of proband to get queues for
     * @returns {Promise<QuestionnaireInstanceQueue[]>} a resolved promise with the found queues or a rejected promise with the error
     */
    getAllQueuesForProband: getAllQueuesForProband,

    /**
     * @function
     * @description deletes the instance queue for the proband
     * @memberof module:postgresqlHelper
     * @param {string} user_id the id of proband to get answers for
     * @param {string} instance_id the id of instance to delete queue for
     * @returns {Promise<void>} a resolved promise with the deleted queue or a rejected promise with the error
     */
    deleteQueue: deleteQueue,

    /**
     * @function
     * @description gets the answers for the questionnaire instance with id for a Forscher (both v1 and v2)
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the questionnaire instance to get answers for
     * @returns {Promise} a resolved promise with the found answers or a rejected promise with the error
     */
    getAnswersForForscher: getAnswersForForscher,

    /**
     * @function
     * @description deletes the answer with the specified questionnaire instance id and answer option id
     * @memberof module:postgresqlHelper
     * @param {number} questionnaire_instance_id the id of the questionnaire instance to delete an answer from
     * @param {number} answer_option_id the id of the answer option to delete an answer from
     * @param {number} version the version of the answers to post, 1 or 2
     * @returns {Promise} a resolved promise with the deleted answer or a rejected promise with the error
     */
    deleteAnswer: deleteAnswer,

    /**
     * @function
     * @description gets a stream of answers from the specified probands
     * @memberof module:postgresqlHelper
     * @param {array} questionnaires
     * @param {array} probands
     * @param {Date} start_date
     * @param {Date} end_date
     * @param {string} study_name
     * @returns {Readable} stream of the answers
     */
    streamAnswers: streamAnswers,

    /**
     * @function
     * @description gets a stream of lab results from the specified probands
     * @memberof module:postgresqlHelper
     * @param {array} probands
     * @param {Date} start_date
     * @param {Date} end_date
     * @returns {Readable} stream of the lab results
     */
    streamLabResults: streamLabResults,

    /**
     * @function
     * @description gets a stream of samples from the specified probands
     * @memberof module:postgresqlHelper
     * @param {array} probands
     * @returns {Readable} stream of the blood samples
     */
    streamSamples: streamSamples,

    /**
     * @function
     * @description gets a stream of blodd samples from the specified probands
     * @memberof module:postgresqlHelper
     * @param {array} probands
     * @returns {Readable} stream of the blood settings
     */
    streamBloodSamples: streamBloodSamples,

    /**
     * @function
     * @description gets a stream of settings from the specified probands
     * @memberof module:postgresqlHelper
     * @param {array} the probands
     * @returns {Readable} stream of the settings
     */
    streamSettings: streamSettings,

    /**
     * @function
     * @description gets a stream of user files
     * @memberof module:postgresqlHelper
     * @param {fileIDs} the ids of the files
     * @returns {Readable<UserFile>} stream of the files
     */
    streamFiles: streamFiles,
    /**
     * @function
     * @description get one image from the database
     * @returns {Promise<UserFile>}
     */
    getFileBy: getFileBy,

    /**
     * @function
     * @description gets the study address with the specified id
     * @memberof module:postgresqlHelper
     * @param {string} id the id of the study to find
     * @returns {Promise} a resolved promise with the found study or a rejected promise with the error
     */
    getStudyAddresses: getStudyAddresses,

    /**
     * @function
     * @description gets the answer option type
     * @memberof module:postgresqlHelper
     * @param {number[]} answerOptionID the list of answer option ids
     * @returns {Promise} a resolved promise with the found answer option type or a rejected promise with the error
     */
    getAnswerOptionsWithTypes: getAnswerOptionsWithTypes,
  };
})();

module.exports = postgresqlHelper;
