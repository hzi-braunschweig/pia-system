/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FormArray, FormControl, FormGroup } from '@angular/forms';
import {
  ConditionLink,
  ConditionOperand,
  ConditionType,
  Questionnaire,
} from '../../../psa.app.core/models/questionnaire';

export interface TemporaryQuestionConditionForm {
  questionnairesForQuestionCondition: FormControl<Questionnaire[] | undefined>;
  questionMessageNeedToSentQuestionnaire: FormControl<boolean | undefined>;
  selectedConditionTypeQuestion: FormControl<boolean | undefined>;
  selectedQuestionnaireIndexQuestion: FormControl<number | undefined>;
  selectedQuestionIndexQuestion: FormControl<number | undefined>;
  selectedAnswerOptionsIndexQuestion: FormControl<number | undefined>;
  condition_link: FormControl<ConditionLink | undefined>;
}

export interface TemporaryAnswerOptionConditionForm {
  questionnairesForAnswerOptionCondition: FormControl<
    Questionnaire[] | undefined
  >;
  answerOptionMessageNeedToSentQuestionnaire: FormControl<boolean | undefined>;
  selectedConditionTypeAnswerOption: FormControl<boolean | undefined>;
  selectedQuestionnaireIndexAnswerOption: FormControl<number | undefined>;
  selectedQuestionIndexAnswerOption: FormControl<number | undefined>;
  selectedAnswerOptionsIndexAnswerOption: FormControl<number | undefined>;
  condition_link: FormControl<string | undefined>;
}

export interface BaseConditionForm {
  condition_type: FormControl<ConditionType>;
  condition_target_questionnaire: FormControl<number | string>;
  condition_target_answer_option: FormControl<number>;
  condition_question_id: FormControl<number>;
  condition_operand: FormControl<ConditionOperand>;
  condition_value: FormControl<string | string[]>;
  condition_link: FormControl<ConditionLink>;
}

export interface QuestionConditionForm extends BaseConditionForm {
  condition_target_question_pos: FormControl<number>;
  condition_target_answer_option_pos: FormControl<number>;
}

export interface AnswerOptionConditionForm extends BaseConditionForm {
  condition_target_question_pos: FormControl<number>;
  condition_target_answer_option_pos: FormControl<number>;
}

export interface AnswerOptionValueForm {
  value: FormControl<string>;
  value_coded: FormControl<number>;
  is_notable: FormControl<boolean>;
}

export interface AnswerOptionForm {
  id: FormControl<number>;
  position: FormControl<number>;
  text: FormControl<string>;
  variable_name: FormControl<string>;
  answer_type_id: FormControl<number>;
  current_answer_type_id: FormControl<number>;
  coding_enable: FormControl<boolean>;
  has_condition: FormControl<boolean>;
  condition_error: FormControl<string>;
  is_condition_target: FormControl<boolean>;
  tmp_for_condition: FormGroup<TemporaryAnswerOptionConditionForm>;
  values: FormArray<FormGroup<AnswerOptionValueForm>>;
  values_code: FormArray<FormControl<number>>;
  is_notable: FormArray<FormControl<boolean>>;
  restriction_min?: FormControl<number>;
  restriction_max?: FormControl<number>;
  is_decimal?: FormControl<boolean>;
  condition?: FormGroup<AnswerOptionConditionForm>;
}

export interface QuestionForm {
  text: FormControl<string>;
  variable_name: FormControl<string>;
  id: FormControl<number>;
  position: FormControl<number>;
  is_mandatory: FormControl<boolean>;
  has_condition: FormControl<boolean>;
  condition_error: FormControl<string>;
  tmp_for_condition: FormGroup<TemporaryQuestionConditionForm>;
  answer_options: FormArray<FormGroup<AnswerOptionForm>>;
  condition?: FormGroup<QuestionConditionForm>;
}

export interface QuestionnaireForm {
  name: FormControl<string>;
  type: FormControl<string>;
  study_id: FormControl<string>;
  cycle_amount: FormControl<number>;
  activate_at_date: FormControl<string | Date>;
  cycle_unit: FormControl<string>;
  cycle_per_day: FormControl<number>;
  cycle_first_hour: FormControl<number>;
  publish: FormControl<string>;
  keep_answers: FormControl<boolean>;
  activate_after_days: FormControl<number>;
  deactivate_after_days: FormControl<number>;
  notification_tries: FormControl<number>;
  notification_title: FormControl<string>;
  notification_weekday: FormControl<string>;
  notification_interval: FormControl<number>;
  notification_interval_unit: FormControl<string>;
  notification_body_new: FormControl<string>;
  notification_body_in_progress: FormControl<string>;
  compliance_needed: FormControl<boolean>;
  notify_when_not_filled: FormControl<boolean>;
  notify_when_not_filled_time: FormControl<string>;
  notify_when_not_filled_day: FormControl<number>;
  expires_after_days: FormControl<number>;
  finalises_after_days: FormControl<number>;
  questions: FormArray<FormGroup<QuestionForm>>;
  condition_error: FormControl<string>;
  condition?: FormGroup<QuestionConditionForm>;
  answer_options?: FormArray<FormGroup<AnswerOptionForm>>;
}
