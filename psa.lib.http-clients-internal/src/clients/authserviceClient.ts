/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServiceClient } from '../core/serviceClient';
import { CreateAccountRequestInternalDto } from '../dtos/user';

export class AuthserviceClient extends ServiceClient {
  public async createAccount(
    user: CreateAccountRequestInternalDto
  ): Promise<void> {
    return await this.httpClient.post('/auth/user', user);
  }

  public async deleteAccount(username: string): Promise<void> {
    await this.httpClient.delete('/auth/user/' + username);
  }
}
