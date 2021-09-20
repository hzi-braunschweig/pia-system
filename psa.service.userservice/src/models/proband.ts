/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PendingComplianceChange } from './pendingComplianceChange';

export interface Proband {
  username: string;
  ids: string | null;
  study: string;
  studyStatus: StudyStatus;
  accountStatus: AccountStatus;
  /**
   * @deprecated it is only needed for the PM to change the compliance
   * in future it should be moved to the compliance service and managed by
   * the compliance manager
   */
  complianceLabresults: boolean;
  /**
   * @deprecated it is only needed for the PM to change the compliance
   * in future it should be moved to the compliance service and managed by
   * the compliance manager
   */
  complianceSamples: boolean;
  /**
   * @deprecated it is only needed for the PM to change the compliance
   * in future it should be moved to the compliance service and managed by
   * the compliance manager
   */
  complianceBloodsamples: boolean;
  /**
   * @deprecated it is only needed for the PM to change the compliance
   * in future it should be moved to the compliance service and managed by
   * the compliance manager
   */
  pendingComplianceChange: PendingComplianceChange | null;
}

export type AccountStatus =
  | 'active'
  | 'deactivation_pending'
  | 'deactivated'
  | 'no_account';
export type StudyStatus =
  | 'active'
  | 'deactivated'
  | 'deletion_pending'
  | 'deleted';
