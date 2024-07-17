/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { InternalPersonalDataHandler } from '../../handlers/internal/internalPersonalDataHandler';

const route: ServerRoute = {
  path: '/personal/personalData/study/{studyName}',
  method: 'GET',
  handler: InternalPersonalDataHandler.getAllOfStudy,
  options: {
    description: 'Gets the the personal data of all probands of a study',
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string()
          .description(
            'the studyName for which the personal data of all probands is taken for'
          )
          .required(),
      }).unknown(),
    },
  },
};

export default route;
