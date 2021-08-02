/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const usersHandler = require('../handlers/usersHandler.js');

module.exports = {
  path: '/user/probandsIDS',
  method: 'POST',
  handler: usersHandler.createIDSProband,
  config: {
    description:
      'creates a proband from external or internal system only with ids',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        ids: Joi.string().required().description('the ids'),
        study_accesses: Joi.array()
          .required()
          .items(
            Joi.string()
              .description(
                'a name of a study the proband should be assigned to'
              )
              .required()
          )
          .min(1),
      }).unknown(),
    },
  },
};
