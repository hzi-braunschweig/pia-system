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
  path: '/sample/bloodResult/{sample_id}',
  method: 'GET',
  handler: bloodSamplesHandler.getSampleWithSampleID,
  options: {
    description: 'returns single laboratory or blood result',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        sample_id: Joi.string()
          .description('the id of the blood sample')
          .required(),
      }).unknown(),
    },
  },
};
