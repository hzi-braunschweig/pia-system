/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';

export function handleError(error: unknown): never {
  if (error instanceof Boom.Boom) {
    throw error;
  }
  console.error(error);
  throw Boom.internal('An internal Error happened');
}
