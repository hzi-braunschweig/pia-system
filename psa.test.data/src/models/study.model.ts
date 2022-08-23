/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Study {
  name: string;
  description: string;
  pm_email: string | null;
  hub_email: string | null;
  has_required_totp: boolean;
}
