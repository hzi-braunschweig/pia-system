/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Auth,
  Request,
  ResponseToolkit,
  ServerAuthScheme,
  ServerAuthSchemeObject,
} from '@hapi/hapi';
import * as Boom from '@hapi/boom';

interface Options {
  validate: (token: string) => Promise<boolean>;
}

interface RequestWithAccessTokenHeader extends Request {
  headers: { 'x-access-token': string | undefined };
}

export const xAccessTokenSchema: ServerAuthScheme = (
  _server,
  options
): ServerAuthSchemeObject => {
  if (!options || typeof (options as Options).validate !== 'function') {
    throw new Error('options.validate must be a function');
  }
  return {
    authenticate: async function (
      request: RequestWithAccessTokenHeader,
      h: ResponseToolkit
    ): Promise<Auth> {
      const token: string | undefined = request.headers['x-access-token'];

      if (!token) {
        throw Boom.unauthorized('No authorization token provided');
      }
      const valid = await (options as Options).validate(token);

      if (!valid) {
        throw Boom.unauthorized('Provided token is not valid');
      }
      return h.authenticated({ credentials: {} });
    },
  };
};
