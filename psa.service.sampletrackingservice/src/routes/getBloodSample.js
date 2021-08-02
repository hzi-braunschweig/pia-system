/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const bloodSamplesHandler = require('../handlers/bloodSamplesHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/sample/probands/{user_id}/bloodSamples/{sample_id}',
  method: 'GET',
  handler: bloodSamplesHandler.getOneSample,
  options: {
    description: 'returns single blood sample',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        user_id: Joi.string()
          .description('the username of the proband')
          .required(),
        sample_id: Joi.string()
          .description('the id of the blood sample')
          .required(),
      }).unknown(),
    },
  },
};
