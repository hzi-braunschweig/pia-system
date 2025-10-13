/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ConditionFormType,
  QuestionnaireFormType,
} from '../pages/questionnaires/questionnaire-researcher/questionnaire-form';
import { AnswerOption } from '../psa.app.core/models/answerOption';
import {
  ConditionType,
  Questionnaire,
} from '../psa.app.core/models/questionnaire';
import {
  ConditionExternalJson,
  ConditionInternalLastJson,
  ConditionInternalThisJson,
  QuestionnaireJson,
} from '../psa.app.core/models/questionnaireJson';

export function generateExportDataFrom(
  formQuestionnaire: QuestionnaireFormType,
  questionnaires: Questionnaire[]
): QuestionnaireJson {
  return {
    $schema:
      'https://raw.githubusercontent.com/hzi-braunschweig/pia-system/master/json-schemas/questionnaire-export-v1.1.0', // for checking the version
    name: formQuestionnaire.name,
    custom_name: formQuestionnaire.custom_name,
    sort_order: formQuestionnaire.sort_order,
    type: formQuestionnaire.type,
    cycle_amount: formQuestionnaire.cycle_amount,
    activate_at_date: formQuestionnaire.activate_at_date,
    cycle_unit: formQuestionnaire.cycle_unit,
    cycle_per_day: formQuestionnaire.cycle_per_day,
    cycle_first_hour: formQuestionnaire.cycle_first_hour,
    publish: formQuestionnaire.publish,
    keep_answers: formQuestionnaire.keep_answers,
    activate_after_days: formQuestionnaire.activate_after_days,
    deactivate_after_days: formQuestionnaire.deactivate_after_days,
    notification_tries: formQuestionnaire.notification_tries,
    notification_title: formQuestionnaire.notification_title,
    notification_weekday: formQuestionnaire.notification_weekday,
    notification_interval: formQuestionnaire.notification_interval,
    notification_interval_unit: formQuestionnaire.notification_interval_unit,
    notification_body_new: formQuestionnaire.notification_body_new,
    notification_body_in_progress:
      formQuestionnaire.notification_body_in_progress,
    notification_link_to_overview:
      formQuestionnaire.notification_link_to_overview,
    compliance_needed: formQuestionnaire.compliance_needed,
    notify_when_not_filled: formQuestionnaire.notify_when_not_filled,
    notify_when_not_filled_time: formQuestionnaire.notify_when_not_filled_time,
    notify_when_not_filled_day: formQuestionnaire.notify_when_not_filled_day,
    expires_after_days: formQuestionnaire.expires_after_days,
    finalises_after_days: formQuestionnaire.finalises_after_days,
    questions: formQuestionnaire.questions.map((question) => ({
      text: question.text,
      help_text: question.help_text,
      variable_name: question.variable_name,
      is_mandatory: question.is_mandatory,
      answer_options: question.answer_options.map((answerOption) => ({
        text: answerOption.text,
        variable_name: answerOption.variable_name,
        answer_type_id: answerOption.answer_type_id,
        use_autocomplete: answerOption.use_autocomplete,
        values: answerOption.values.map((value) => value.value),
        values_code: answerOption.values.map((value) => value.value_coded),
        is_notable: answerOption.values.map((value) => value.is_notable),
        restriction_min: answerOption.restriction_min,
        restriction_max: answerOption.restriction_max,
        is_decimal: answerOption.is_decimal,
        condition: convertToExportCondition(
          answerOption.condition,
          formQuestionnaire,
          questionnaires
        ),
      })),
      condition: convertToExportCondition(
        question.condition,
        formQuestionnaire,
        questionnaires
      ),
    })),
    condition: convertToExportCondition(
      formQuestionnaire.condition,
      formQuestionnaire,
      questionnaires
    ) as undefined | ConditionExternalJson,
  };
}

function convertToExportCondition(
  condition: ConditionFormType | undefined,
  thisQuestionnaire: QuestionnaireFormType,
  questionnaires: Questionnaire[]
):
  | undefined
  | ConditionExternalJson
  | ConditionInternalThisJson
  | ConditionInternalLastJson {
  if (!condition) return undefined;
  const foundQuestionnaire = questionnaires.find(
    (questionnaire) =>
      `${questionnaire.id}-${questionnaire.version}` ===
      condition.condition_target_questionnaire
  );
  if (!foundQuestionnaire)
    throw Error('Could not find by condition referenced Questionnaire');
  if (!foundQuestionnaire.custom_name)
    throw Error('By condition referenced Questionnaire has no custom_name');

  const foundAnswerOption = getAnswerOptionById(
    condition.condition_target_answer_option,
    foundQuestionnaire
  );
  if (!foundAnswerOption) throw Error('could not find Answer Option');

  switch (condition.condition_type) {
    case ConditionType.EXTERNAL:
      return {
        type: ConditionType.EXTERNAL,
        target_questionnaire_custom_name: foundQuestionnaire.custom_name,
        target_answer_option_variable_name: foundAnswerOption.variable_name,
        operand: condition.condition_operand,
        value: Array.isArray(condition.condition_value)
          ? condition.condition_value.join(';')
          : condition.condition_value.toString(),
        link: condition.condition_link ?? undefined,
      } satisfies ConditionExternalJson;
    case ConditionType.INTERNAL_THIS:
      return {
        type: ConditionType.INTERNAL_THIS,
        ...getAnswerOptionPosition(
          condition.condition_target_answer_option,
          thisQuestionnaire
        ),
        operand: condition.condition_operand,
        value: Array.isArray(condition.condition_value)
          ? condition.condition_value.join(';')
          : condition.condition_value.toString(),
        link: condition.condition_link ?? undefined,
      } satisfies ConditionInternalThisJson;
    case ConditionType.INTERNAL_LAST:
      return {
        type: ConditionType.INTERNAL_LAST,
        ...getAnswerOptionPosition(
          condition.condition_target_answer_option,
          thisQuestionnaire
        ),
        operand: condition.condition_operand,
        value: Array.isArray(condition.condition_value)
          ? condition.condition_value.join(';')
          : condition.condition_value.toString(),
        link: condition.condition_link ?? undefined,
      } satisfies ConditionInternalLastJson;
    default:
      throw Error(`Unknown condition type`);
  }
}

function getAnswerOptionById(
  answerOptionId: number,
  questionnaire: Questionnaire
): AnswerOption | null {
  for (const question of questionnaire.questions) {
    for (const answerOption of question.answer_options) {
      if (answerOption.id === answerOptionId) {
        return answerOption;
      }
    }
  }
  return null;
}

function getAnswerOptionPosition(
  answerOptionId: number,
  questionnaire: { questions: { answer_options: { id: number }[] }[] }
): { target_question_pos: number; target_answer_option_pos: number } {
  for (
    let questionIndex = 0;
    questionIndex < questionnaire.questions.length;
    questionIndex++
  ) {
    const question = questionnaire.questions[questionIndex];
    for (
      let answerOptionIndex = 0;
      answerOptionIndex < question.answer_options.length;
      answerOptionIndex++
    ) {
      const answerOption = question.answer_options[answerOptionIndex];
      if (answerOption.id === answerOptionId) {
        return {
          target_question_pos: questionIndex + 1,
          target_answer_option_pos: answerOptionIndex + 1,
        };
      }
    }
  }
  throw Error(
    `Could not find answer option with id ${answerOptionId} in this questionnaire`
  );
}
