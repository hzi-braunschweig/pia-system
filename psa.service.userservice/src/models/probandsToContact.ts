/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AccountStatus } from './accountStatus';
import { ProbandStatus } from './probandStatus';

export interface ProbandsToContactRequest {
  processed: boolean;
}

export interface ProbandToContactDto extends ProbandToContact {
  accountStatus: AccountStatus;
}

export interface ProbandToContact {
  id: number;
  user_id: string;
  study: string;
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
