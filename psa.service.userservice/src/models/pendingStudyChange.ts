/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface PendingStudyChange {
  id: number;
  requested_by: string;
  requested_for: string; // email
  study_id: string;
  description_from: string | null;
  description_to: string | null;
  has_rna_samples_from: boolean;
  has_rna_samples_to: boolean;
  sample_prefix_from: string | null;
  sample_prefix_to: string | null;
  sample_suffix_length_from: number | null;
  sample_suffix_length_to: number | null;
  pseudonym_prefix_from: string | null;
  pseudonym_prefix_to: string | null;
  pseudonym_suffix_length_from: number | null;
  pseudonym_suffix_length_to: number | null;
  has_answers_notify_feature_from: boolean | null;
  has_answers_notify_feature_to: boolean | null;
  has_answers_notify_feature_by_mail_from: boolean | null;
  has_answers_notify_feature_by_mail_to: boolean | null;
  has_four_eyes_opposition_from: boolean | null;
  has_four_eyes_opposition_to: boolean | null;
  has_partial_opposition_from: boolean | null;
  has_partial_opposition_to: boolean | null;
  has_total_opposition_from: boolean | null;
  has_total_opposition_to: boolean | null;
  has_compliance_opposition_from: boolean | null;
  has_compliance_opposition_to: boolean | null;
  has_logging_opt_in_from: boolean | null;
  has_logging_opt_in_to: boolean | null;
}

export interface PendingStudyChangeRequest {
  requested_for: string;
  study_id: string;
  description_to?: string | null;
  has_rna_samples_to?: boolean;
  sample_prefix_to?: string | null;
  sample_suffix_length_to?: number | null;
  pseudonym_prefix_to?: string | null;
  pseudonym_suffix_length_to?: number | null;
  has_answers_notify_feature_to?: boolean;
  has_answers_notify_feature_by_mail_to?: boolean;
  has_four_eyes_opposition_to?: boolean;
  has_partial_opposition_to?: boolean;
  has_total_opposition_to?: boolean;
  has_compliance_opposition_to?: boolean;
  has_logging_opt_in_from?: boolean;
  has_logging_opt_in_to?: boolean;
}
