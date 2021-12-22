/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface PendingPersonalDataDeletion {
  id: number;
  requested_by: string;
  requested_for: string;
  proband_id: string;
  study: string;
}
