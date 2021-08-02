/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { Boom, boomify } = require('@hapi/boom');

module.exports = function handleError(request, message, err) {
  if (err instanceof Boom) {
    throw err;
  } else {
    request.log(
      'error',
      message + ' ' + err.stack + JSON.stringify(err, null, 2)
    );
    throw boomify(err);
  }
};
