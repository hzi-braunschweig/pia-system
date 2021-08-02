/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const complianceHandler = require('../handlers/complianceHandler.js');

module.exports = {
  path: '/compliance/{study}/agree/instance/{id}',
  method: 'GET',
  handler: complianceHandler.getComplianceAgreeById,
  config: {
    description: 'fetches compliance agreement by its id',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string().description('the name of the study').required(),
        id: Joi.number()
          .integer()
          .description('the id of the compliance agreement')
          .required(),
      }).unknown(),
    },
  },
};
