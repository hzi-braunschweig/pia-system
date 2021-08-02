/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const pendingDeletionsHandler = require('../handlers/pendingDeletionsHandler.js');

module.exports = {
  path: '/user/pendingdeletions/sample/{sample_id}',
  method: 'GET',
  handler: pendingDeletionsHandler.getOneForSampleId,
  config: {
    description: 'get a pending deletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        sample_id: Joi.string()
          .description(
            'the sample id of the proband for pending deletion to get'
          )
          .required(),
      }).unknown(),
    },
  },
};
