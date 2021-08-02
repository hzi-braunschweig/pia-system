/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const pendingDeletionsHandler = require('../handlers/pendingDeletionsHandler.js');

module.exports = {
  path: '/user/pendingdeletions',
  method: 'POST',
  handler: pendingDeletionsHandler.createOne,
  config: {
    description: 'creates a deletion request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        requested_for: Joi.string()
          .required()
          .description('the user who should confirm the deletion'),
        type: Joi.string().required().valid('proband', 'sample', 'study'),
        for_id: Joi.string()
          .required()
          .description(
            'the id the pending deletion request is associated with'
          ),
      }).unknown(),
    },
  },
};
