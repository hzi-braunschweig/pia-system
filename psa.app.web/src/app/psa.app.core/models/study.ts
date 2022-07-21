/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Study {
  name: string;
  description: string;
  pm_email: string;
  hub_email: string;
  status: StudyStatus;
  has_rna_samples?: boolean;
  sample_prefix?: string;
  sample_suffix_length?: number;
  pseudonym_prefix?: string;
  pseudonym_suffix_length?: number;
  has_answers_notify_feature: boolean;
  has_answers_notify_feature_by_mail: boolean;
  has_four_eyes_opposition: boolean;
  has_partial_opposition: boolean;
  has_total_opposition: boolean;
  has_compliance_opposition: boolean;
  has_logging_opt_in: boolean;
  pendingStudyChange: any;
}

export type StudyStatus = 'active' | 'deletion_pending' | 'deleted';
