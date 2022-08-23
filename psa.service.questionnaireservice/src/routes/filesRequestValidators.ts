/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RouteOptionsValidate } from '@hapi/hapi';
import Joi from 'joi';

export const getFileValidation: RouteOptionsValidate = {
  params: Joi.object({
    id: Joi.string().description('file id').required(),
  }).unknown(),
};
