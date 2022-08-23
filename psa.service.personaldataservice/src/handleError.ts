/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Request } from '@hapi/hapi';
import { Boom, boomify } from '@hapi/boom';

const jsonIdentation = 2;

export function handleError(
  request: Request,
  message: string,
  err: Error
): never {
  if (err instanceof Boom) {
    throw err;
  } else {
    request.log(
      'error',
      `${message} ${err.stack ?? ''}${JSON.stringify(
        err,
        null,
        jsonIdentation
      )}`
    );
    throw boomify(err);
  }
}
