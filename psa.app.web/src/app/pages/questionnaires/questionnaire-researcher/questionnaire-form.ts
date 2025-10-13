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
  CycleUnit,
  Publish,
  Questionnaire,
  QuestionnaireType,
} from '../../../psa.app.core/models/questionnaire';

type ArrayElementType<ArrayType extends T[], T = unknown> = ArrayType[number];

export type FormType<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends Record<string, unknown>[]
    ? FormArray<FormGroup<FormType<T[K][number]>>>
    : T[K] extends unknown[]
    ? FormArray<FormControl<ArrayElementType<T[K]>>>
    : T[K] extends Record<string, unknown>
    ? FormGroup<FormType<T[K]>>
    : FormControl<T[K]>;
};

export type TemporaryQuestionConditionFormType = {
  questionnairesForQuestionCondition: Questionnaire[] | undefined;
  questionMessageNeedToSentQuestionnaire: boolean | undefined;
  selectedConditionTypeQuestion: boolean | undefined;
  selectedQuestionnaireIndexQuestion: number | undefined;
  selectedQuestionIndexQuestion: number | undefined;
  selectedAnswerOptionsIndexQuestion: number | undefined;
  condition_link: ConditionLink | undefined;
};

export type TemporaryQuestionConditionForm = FormType<
  Omit<TemporaryQuestionConditionFormType, 'questionnairesForQuestionCondition'>
> & {
  questionnairesForQuestionCondition: FormControl<Questionnaire[] | undefined>;
};

export type TemporaryAnswerOptionConditionFormType = {
  questionnairesForAnswerOptionCondition: Questionnaire[] | undefined;
  answerOptionMessageNeedToSentQuestionnaire: boolean | undefined;
  selectedConditionTypeAnswerOption: boolean | undefined;
  selectedQuestionnaireIndexAnswerOption: number | undefined;
  selectedQuestionIndexAnswerOption: number | undefined;
  selectedAnswerOptionsIndexAnswerOption: number | undefined;
  condition_link: string | undefined;
};

export type TemporaryAnswerOptionConditionForm = FormType<
  Omit<
    TemporaryAnswerOptionConditionFormType,
    'questionnairesForAnswerOptionCondition'
  >
> & {
  questionnairesForAnswerOptionCondition: FormControl<
    Questionnaire[] | undefined
  >;
};

type BaseConditionFormType = {
  condition_type: ConditionType;
  condition_target_questionnaire: number | string;
  condition_target_answer_option: number;
  condition_question_id: number;
  condition_operand: ConditionOperand;
  condition_value: string | string[] | Date;
  condition_link: ConditionLink;
};

export type ConditionFormType = BaseConditionFormType & {
  condition_target_question_pos: number;
  condition_target_answer_option_pos: number;
};

export type ConditionForm = FormType<ConditionFormType>;

export type AnswerOptionValueFormType = {
  value: string;
  value_coded: number;
  is_notable: boolean;
};

export type AnswerOptionValueForm = FormType<AnswerOptionValueFormType>;

export type AnswerOptionFormType = {
  id: number;
  position: number;
  text: string;
  variable_name: string;
  answer_type_id: number;
  current_answer_type_id: number;
  use_autocomplete: boolean;
  coding_enable: boolean;
  has_condition: boolean;
  condition_error: string;
  is_condition_target: boolean;
  tmp_for_condition: TemporaryAnswerOptionConditionFormType;
  values: AnswerOptionValueFormType[];
  values_code: number[];
  is_notable: boolean[];
  restriction_min?: number;
  restriction_max?: number;
  is_decimal?: boolean;
  condition?: ConditionFormType;
};

export type AnswerOptionForm = FormType<
  Omit<AnswerOptionFormType, 'tmp_for_condition'>
> & { tmp_for_condition: FormGroup<TemporaryAnswerOptionConditionForm> };

export type QuestionFormType = {
  text: string;
  help_text: string;
  variable_name: string;
  id: number;
  position: number;
  is_mandatory: boolean;
  has_condition: boolean;
  condition_error: string;
  tmp_for_condition: TemporaryQuestionConditionFormType;
  answer_options: AnswerOptionFormType[];
  condition?: ConditionFormType;
};

export type QuestionForm = FormType<
  Omit<QuestionFormType, 'tmp_for_condition' | 'answer_options'>
> & {
  tmp_for_condition: FormGroup<TemporaryQuestionConditionForm>;
  answer_options: FormArray<FormGroup<AnswerOptionForm>>;
};

export type QuestionnaireFormType = {
  name: string;
  custom_name: string;
  sort_order: number;
  type: QuestionnaireType;
  study_id: string;
  cycle_amount: number;
  activate_at_date: string;
  cycle_unit: CycleUnit;
  cycle_per_day: number;
  cycle_first_hour: number;
  publish: Publish;
  keep_answers: boolean;
  activate_after_days: number;
  deactivate_after_days: number;
  notification_tries: number;
  notification_title: string;
  notification_weekday: string;
  notification_interval: number;
  notification_interval_unit: string;
  notification_body_new: string;
  notification_body_in_progress: string;
  notification_link_to_overview: boolean;
  compliance_needed: boolean;
  notify_when_not_filled: boolean;
  notify_when_not_filled_time: string;
  notify_when_not_filled_day: number;
  expires_after_days: number;
  finalises_after_days: number;
  questions: QuestionFormType[];
  condition_error: string;
  condition?: ConditionFormType;
};

export type QuestionnaireForm = FormType<
  Omit<QuestionnaireFormType, 'questions'>
> & { questions: FormArray<FormGroup<QuestionForm>> };
