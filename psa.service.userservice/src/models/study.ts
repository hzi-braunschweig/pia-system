/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PendingStudyChange } from './pendingStudyChange';

export type StudyStatus = 'active' | 'deletion_pending' | 'deleted';

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
  pendingStudyChange?: PendingStudyChange | null;
}

/**
 * Some fields like the totp require status are not
 * persisted in the DB. Instead, they will be resolved by
 * the authserver.
 *
 * Totp is required, if the group representing the study
 * has a mapping to the realm role "feature:RequireTotp"
 *
 * has_open_self_registration is true, if the group
 * representing the study has the attribute "maxAccountsCount".
 * max_allowed_accounts_count will have the value of the
 * attribute "maxAccountsCount" if it is set, otherwise null.
 */
export interface AdditionalAuthserverFields {
  proband_realm_group_id: string | null;
  has_required_totp: boolean | null;
  has_open_self_registration: boolean;
  max_allowed_accounts_count: number | null;
  accounts_count: number;
}

export type Study = DbStudy & AdditionalAuthserverFields;
