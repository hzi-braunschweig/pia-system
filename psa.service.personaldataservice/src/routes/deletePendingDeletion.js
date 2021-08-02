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
  path: '/personal/pendingdeletions/{proband_id}',
  method: 'DELETE',
  handler: pendingDeletionsHandler.deleteOne,
  options: {
    description: 'cancels a pending deletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        proband_id: Joi.string()
          .description('the proband id for deletion to cancel')
          .required(),
      }).unknown(),
    },
  },
};
