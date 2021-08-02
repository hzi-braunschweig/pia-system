/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const studyAccessesHandler = require('../handlers/studyAccessesHandler.js');

module.exports = {
  path: '/questionnaire/studies/{name}/accesses/{username}',
  method: 'GET',
  handler: studyAccessesHandler.getOne,
  config: {
    description:
      'get the studiy access with the specified username if the user has access',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        name: Joi.string()
          .description('the name of the study')
          .required()
          .default('Teststudie1'),
        username: Joi.string()
          .description('the name of the user')
          .required()
          .default('Testproband1'),
      }).unknown(),
    },
  },
};
