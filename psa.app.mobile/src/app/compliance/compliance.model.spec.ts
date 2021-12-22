/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComplianceDataResponse } from './compliance.model';
import { SegmentType } from './segment.model';

export function createComplianceDataResponse(
  appCompliance: boolean = true
): ComplianceDataResponse {
  return {
    compliance_text_object: [{ type: SegmentType.HTML, html: '' }],
    timestamp: new Date(),
    textfields: {
      firstname: 'heiko',
      lastname: 'schotte',
      birthdate: new Date('1968-03-12'),
      location: 'Muster-Stadt',
    },
    compliance_system: {
      app: appCompliance,
      samples: false,
      bloodsamples: true,
      labresults: true,
    },
    compliance_questionnaire: [{ name: 'world-domination', value: true }],
  };
}
