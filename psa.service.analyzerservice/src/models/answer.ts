/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Answer {
  question_id: number;
  questionnaire_instance_id: number;
  answer_option_id: number;
  versioning?: number;
  value: string;
  date_of_release?: Date;
  releasing_person?: string;
}
