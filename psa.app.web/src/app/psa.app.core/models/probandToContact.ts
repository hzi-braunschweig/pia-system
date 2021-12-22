/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AccountStatus, ProbandStatus } from './proband';

export interface ProbandToContact {
  id: number;
  user_id: string;
  accountStatus: AccountStatus;
  status: ProbandStatus;
  ids: string | null;
  notable_answer_questionnaire_instances: { questionnaire_name: string }[];
  is_notable_answer: boolean | null;
  is_notable_answer_at: Date | null;
  not_filledout_questionnaire_instances: { questionnaire_name: string }[];
  is_not_filledout: boolean | null;
  is_not_filledout_at: Date | null;
  processed: boolean | null;
  processed_at: Date | null;
  created_at: Date;
}
