/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PlannedProbandStudyAccess } from './studyAccess';

export class PlannedProband {
  user_id: string;
  password: string;
  activated_at: Date;
  wasCreated: boolean;
  studies?: string;
  study_accesses?: PlannedProbandStudyAccess[];
}
