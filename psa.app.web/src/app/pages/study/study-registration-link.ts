/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { environment } from '../../../environments/environment';
import { Study } from '../../psa.app.core/models/study';

export function createRegistrationUrl(study: Study): string {
  return `${environment.probandAppBaseUrl}/registration/${study.proband_realm_group_id}`;
}
