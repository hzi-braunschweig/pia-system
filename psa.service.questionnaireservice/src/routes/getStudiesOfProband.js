/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const studiesHandler = require('../handlers/studiesHandler.js');

module.exports = {
  path: '/questionnaire/studies/proband/{username}',
  method: 'GET',
  handler: studiesHandler.getAllStudiesOfProband,
  config: {
    description:
      'get all studies of a proband the requesting user has access to',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the username of the proband to get studies for')
          .required(),
      }).unknown(),
    },
  },
};
