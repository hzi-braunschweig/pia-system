/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const studyAccessesHandler = require('../handlers/studyAccessesHandler.js');

module.exports = {
  path: '/questionnaire/studies/{name}/accesses',
  method: 'GET',
  handler: studyAccessesHandler.getAll,
  config: {
    description: 'get all study accesses the user has access to',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        name: Joi.string()
          .description('the name of the study')
          .required()
          .default('Teststudie1'),
      }).unknown(),
    },
  },
};
