/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const pendingStudyChangesHandler = require('../handlers/pendingStudyChangesHandler.js');

module.exports = {
  path: '/user/pendingstudychanges/{id}',
  method: 'DELETE',
  handler: pendingStudyChangesHandler.deleteOne,
  config: {
    description: 'cancels a pending study change',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the pending study change id to cancel')
          .required(),
      }).unknown(),
    },
  },
};
