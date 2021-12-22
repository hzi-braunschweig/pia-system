/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { SymptomDiaryHandler } from '../handlers/symptomDiaryHandler';
import Joi from 'joi';

const route: ServerRoute = {
  path: '/sormas/symptomdiary/probands/data',
  method: 'GET',
  handler: SymptomDiaryHandler.getProband,
  options: {
    description: 'view a proband that was registered in pia by sormas',
    tags: ['api'],
    validate: {
      query: Joi.object({
        q: Joi.string()
          .description('person UUID of contact person in SORMAS')
          .required(),
        queryKey: Joi.string()
          .optional()
          .description('a submitted value from sormas but not used in pia'),
        token: Joi.string()
          .required()
          .description('the same token as elsewhere in x-access-token'),
      }).unknown(false),
    },
  },
};

export default route;
