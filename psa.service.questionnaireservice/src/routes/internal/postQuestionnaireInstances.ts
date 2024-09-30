/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { InternalQuestionnaireInstancesHandler } from '../../handlers/internal/internalQuestionnaireInstancesHandler';
import { ServerRoute } from '@hapi/hapi';
import {
  CreateQuestionnaireInstanceInternalDto,
  QuestionnaireInstanceOriginInternalDto,
} from '@pia-system/lib-http-clients-internal';

const route: ServerRoute = {
  path: '/questionnaire/questionnaireInstances',
  method: 'POST',
  handler: InternalQuestionnaireInstancesHandler.postMany,
  options: {
    description:
      'Creates a set of questionnaire instances, which can include an optional origin',
    tags: ['api'],
    validate: {
      payload: Joi.array().items(
        Joi.object<CreateQuestionnaireInstanceInternalDto>({
          studyId: Joi.string(),
          pseudonym: Joi.string(),
          questionnaireName: Joi.string(),
          questionnaireId: Joi.number(),
          questionnaireVersion: Joi.number(),
          sortOrder: Joi.number().allow(null),
          dateOfIssue: Joi.date(),
          cycle: Joi.number(),
          options: Joi.object<
            CreateQuestionnaireInstanceInternalDto['options']
          >({
            addToQueue: Joi.boolean().optional(),
          }).optional(),
          status: Joi.string().valid('inactive', 'active', 'expired'),
          origin: Joi.object<QuestionnaireInstanceOriginInternalDto>({
            originInstance: Joi.number(),
            condition: Joi.number(),
          }).allow(null),
        }).options({ presence: 'required' })
      ),
      failAction: (_request, _h, err) => err ?? null, // show detailed validation error
    },
  },
};
export default route;
