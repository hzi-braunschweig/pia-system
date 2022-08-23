/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Request } from '@hapi/hapi';
import { AccessToken } from '@pia/lib-service-core';

export function withAppLocale(request: Request): Request {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  request.app.locale = (request.auth.credentials as AccessToken).locale;
  return request;
}
