/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface DbStudy {
  name: string;
  description: string | null;
  pm_email: string | null;
  hub_email: string | null;
  status: StudyStatus | null;
  address: string | null;
  has_rna_samples: boolean | null;
  sample_prefix: string | null;
  sample_suffix_length: number | null;
  pseudonym_prefix: string | null;
  pseudonym_suffix_length: number | null;
  has_answers_notify_feature: boolean | null;
  has_answers_notify_feature_by_mail: boolean | null;
  has_four_eyes_opposition: boolean | null;
  has_partial_opposition: boolean | null;
  has_total_opposition: boolean | null;
  has_compliance_opposition: boolean | null;
  has_logging_opt_in: boolean | null;
}

export type StudyStatus = 'active' | 'deletion_pending' | 'deleted';

export type Study = DbStudy;
