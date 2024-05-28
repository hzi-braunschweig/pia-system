/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ConditionLink } from './condition';
import { CycleUnit } from './questionnaire';

export enum ExportBoolean {
  true = 'T',
  false = 'F',
}

export enum AnswerStatus {
  PendingAnswer = 'pending_answer',
  ExpiredAnswer = 'expired_answer',
  LatestStudyAssistantAnswer = 'latest_study_assistant_answer',
  InProgressAnswer = 'in_progress_answer',
  ModifiableParticipantAnswer = 'modifiable_participant_answer',
  FinalParticipantAnswer = 'final_participant_answer',
}

export interface CsvLegacyAnswerRow {
  Antwort: string;
  Proband: string;
  IDS: string;
  FB_Datum: string;
  Antwort_Datum: string;
  Kodierung_Wert: string | string[];
  Kodierung_Code: string | string[];
  Frage: string;
}

export interface CsvAnswerRow extends Record<string, string | number | null> {
  participant: string | null;
  is_test_participant: ExportBoolean | null;
  questionnaire_name: string | null;
  questionnaire_id: number | null;
  questionnaire_version: number | null;
  questionnaire_cycle: number | null;
  questionnaire_date_of_issue: string | null;
  answer_date: string | null;
  answer_status: AnswerStatus | null;
}

export interface CsvLabResultObservationRow {
  PCR_ID: string;
  Kommentar: string;
  Auftragsnr: string;
  Bericht_ID: string;
  Proband: string;
  IDS: string;
  Datum_Mitteilung: string;
  Datum_Abnahme: string;
  Arzt: string;
  Datum_Eingang: string;
  Datum_Analyse: string;
  'CT-Wert': string;
  Ergebnis: string;
  PCR: string;
}

export interface CsvSampleRow {
  Proben_ID: string;
  Bakt_Proben_ID: string;
  Proband: string;
  IDS: string;
  Status: string;
  Bemerkung: string;
}

export interface CsvBloodSampleRow {
  Blutproben_ID: string;
  Proband: string;
  IDS: string;
  Status: string;
  Bemerkung: string;
}

export interface CsvUserSettingsRow {
  Proband: string;
  IDS: string;
  'Einwilligung Ergebnismitteilung': string;
  'Einwilligung Probenentnahme': string;
  'Einwilligung Blutprobenentnahme': string;
  Testproband: string;
}

export interface CsvCodebookRow extends Record<string, unknown> {
  questionnaire_id: number;
  questionnaire_version: number;
  questionnaire_name: string;
  variable_name: string;
  column_name: string;
  answer_position: string;
  text_level_1: string | null;
  help_text_level_1: string | null;
  text_level_2: string | null;
  answer_option_text: string | null;
  answer_type: string | null;
  answer_category: string | null;
  answer_category_code: number | string | null;
  valid_min: string | null;
  valid_max: string | null;
  answer_required: ExportBoolean | null;
  condition_question: ExportBoolean | null;
  condition_question_type: string | null;
  condition_question_questionnaire_id: number | null;
  condition_question_questionnaire_version: number | null;
  condition_question_column_name: string | null;
  condition_question_operand: string | null;
  condition_question_answer_value: string | null;
  condition_question_link: ConditionLink | null;
}

export interface CsvQuestionnaireRow {
  questionnaire_name: string;
  questionnaire_id: number;
  questionnaire_version: number;
  questionnaire_version_start: string;
  questionnaire_version_end: string | null;
  questionnaire_type: string | null;
  cycle_unit: CycleUnit | null;
  cycle_amount: number | null;
  cycle_per_day: number | null;
  cycle_first_at: number | null;
  activate_at_date: string | null;
  activate_after_days: number;
  deactivate_after_days: number;
  expires_after_days: number;
  non_modifiable_after_days: number;
  notification_tries: number;
  notification_title: string;
  notification_body_new: string;
  notification_body_in_progress: string;
  compliance_samples_needed: ExportBoolean;
  visibility: string | null;
  despite_end_signal: ExportBoolean;
  deactivated: ExportBoolean;
  deactivated_at: string | null;
  condition_questionnaire: ExportBoolean;
  condition_questionnaire_name: string | null;
  condition_questionnaire_id: number | null;
  condition_questionnaire_version: number | null;
  condition_questionnaire_question_id: string | null;
  condition_questionnaire_question_column_name: string | null;
  condition_questionnaire_question_operand: string | null;
  condition_questionnaire_question_answer_value: string | null;
  condition_questionnaire_question_link: ConditionLink | null;
}
