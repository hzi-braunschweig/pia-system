/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { UserWithStudyAccess } from '../../../psa.app.core/models/user-with-study-access';

export interface TranslatedUser {
  username: string;
  ids: string | null;
  study_accesses: string;
  is_test_proband: string;
  first_logged_in_at: string;
  status: string;
  userObject: UserWithStudyAccess;
}
