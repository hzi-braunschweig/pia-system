/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import hapi from '@hapi/hapi';

export interface RequestWithUser extends hapi.Request {
  user: {
    studies: string[];
  };
}
