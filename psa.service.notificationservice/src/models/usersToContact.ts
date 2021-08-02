/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface DbUsersToContact {
  id?: number;
  user_id: string;
  notable_answer_questionnaire_instances: number[] | null;
  is_notable_answer: boolean;
  is_notable_answer_at: Date | null;
  not_filledout_questionnaire_instances: number[] | null;
  is_not_filledout: boolean | null;
  is_not_filledout_at: Date | null;
  processed: boolean;
  processed_at: Date | null;
  created_at: Date | null;
}
