/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ConditionLink } from './condition';
import { CodebookBoolean } from './codebook';

export interface CsvAnswerRow {
  Antwort: string;
  Proband: string;
  IDS: string;
  FB_Datum: string;
  Antwort_Datum: string;
  Kodierung_Wert: string | string[];
  Kodierung_Code: string | string[];
  Frage: string;
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
  text_level_2: string | null;
  answer_option_text: string | null;
  answer_type: string | null;
  answer_category: string | null;
  answer_category_code: number | string | null;
  valid_min: string | null;
  valid_max: string | null;
  answer_required: CodebookBoolean | null;
  condition_question: CodebookBoolean | null;
  condition_question_type: string | null;
  condition_question_questionnaire_id: number | null;
  condition_question_questionnaire_version: number | null;
  condition_question_column_name: string | null;
  condition_question_operand: string | null;
  condition_question_answer_value: string | null;
  condition_question_link: ConditionLink | null;
}
