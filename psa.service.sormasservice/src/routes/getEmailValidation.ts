/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { SymptomDiaryHandler } from '../handlers/symptomDiaryHandler';

const route: ServerRoute = {
  path: '/sormas/symptomdiary/probands',
  method: 'GET',
  handler: SymptomDiaryHandler.getEmailValidation,
  options: {
    description:
      'pseudo email validation to be compatible with API expected by SORMAS',
    auth: 'sormas-one-time-token',
    tags: ['api'],
  },
};

export default route;
