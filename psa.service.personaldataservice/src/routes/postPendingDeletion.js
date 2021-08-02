/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const pendingDeletionsHandler = require('../handlers/pendingDeletionsHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/personal/pendingdeletions',
  method: 'POST',
  handler: pendingDeletionsHandler.createOne,
  options: {
    description: 'creates a deletion request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        requested_for: Joi.string()
          .required()
          .description('the user who should confirm the deletion'),
        proband_id: Joi.string()
          .required()
          .description(
            'the id of proband the pending deletion request is associated with'
          ),
      }).unknown(false),
    },
  },
};
