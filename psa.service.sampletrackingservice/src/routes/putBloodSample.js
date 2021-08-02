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
  method: 'PUT',
  handler: bloodSamplesHandler.updateOneSample,
  options: {
    description: 'updates a single blood sample',
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
      payload: Joi.object({
        remark: Joi.string()
          .allow('')
          .description('a free remark text the PM can save')
          .optional(),
        blood_sample_carried_out: Joi.boolean()
          .allow(null)
          .description('status of the blood sample')
          .optional(),
      }),
    },
  },
};
