/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const pendingDeletionsHandler = require('../handlers/pendingDeletionsHandler.js');

module.exports = {
  path: '/user/pendingdeletions/study/{study_id}',
  method: 'GET',
  handler: pendingDeletionsHandler.getOneForStudyId,
  config: {
    description: 'get a pending deletion for a study',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study_id: Joi.string()
          .description('the study id of the pending deletion to get')
          .required(),
      }).unknown(),
    },
  },
};
