/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Proband } from '../../../psa.app.core/models/proband';

export interface TranslatedUser {
  username: string;
  ids: string | null;
  study: string;
  is_test_proband: string;
  first_logged_in_at: Date;
  status: string;
  userObject: Proband;
}
