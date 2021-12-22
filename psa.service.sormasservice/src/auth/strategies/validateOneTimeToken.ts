/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TokenService } from '../../services/tokenService';

export async function validateOneTimeTokenAuth(
  token: string
): Promise<boolean> {
  return await TokenService.isValid(token);
}
