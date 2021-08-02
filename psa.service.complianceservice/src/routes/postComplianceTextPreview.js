/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const complianceTextHandler = require('../handlers/complianceTextHandler');

module.exports = {
  path: '/compliance/text/preview',
  method: 'POST',
  handler: complianceTextHandler.postComplianceTextPreview,
  config: {
    description: 'converts the compliance text for preview',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        compliance_text: Joi.string().required(),
      }),
    },
  },
};
