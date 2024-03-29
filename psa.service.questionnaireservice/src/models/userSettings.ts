/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface UserSettings {
  pseudonym: string;
  ids: string | null;
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
  is_test_proband: boolean;
}
