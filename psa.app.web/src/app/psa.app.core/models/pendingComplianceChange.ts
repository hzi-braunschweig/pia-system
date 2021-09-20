/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface PendingComplianceChange {
  id: number;
  requested_by: string;
  requested_for: string;
  proband_id: string;
  compliance_labresults_from: boolean;
  compliance_labresults_to: boolean;
  compliance_samples_from: boolean;
  compliance_samples_to: boolean;
  compliance_bloodsamples_from: boolean;
  compliance_bloodsamples_to: boolean;
}
