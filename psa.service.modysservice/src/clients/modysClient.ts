/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  VPersonContactDetailOverview,
  VPersonOverview,
} from '../models/modysApi';
import { ModysConnectionConfig } from '../models/modys';
import { ServiceClient } from '@pia-system/lib-http-clients-internal';

export class ModysClient extends ServiceClient {
  public constructor(private readonly connectionConfig: ModysConnectionConfig) {
    super(
      connectionConfig.baseUrl +
        (connectionConfig.baseUrl.endsWith('/') ? 'api' : '/api')
    );
  }

  public async getProbandIdentifierbyId(
    identifier: string,
    identifierTypeId: number
  ): Promise<string> {
    return await this.httpClient.get(
      `/pidByIdandType/${identifier}/${identifierTypeId}`,
      {
        responseType: 'text',
        headers: this.getAuthorizationHeader(),
      }
    );
  }

  public async getProbandWithId(probandId: string): Promise<VPersonOverview> {
    return await this.httpClient.get<VPersonOverview>(
      `/probands/${probandId}`,
      {
        headers: this.getAuthorizationHeader(),
      }
    );
  }

  public async getProbandContactDetails(
    probandId: string
  ): Promise<VPersonContactDetailOverview[]> {
    return await this.httpClient.get<VPersonContactDetailOverview[]>(
      `/probandContactDetails/${probandId}`,
      {
        headers: this.getAuthorizationHeader(),
      }
    );
  }

  private getAuthorizationHeader(): Record<string, string> {
    return {
      Authorization:
        'Basic ' +
        Buffer.from(
          this.connectionConfig.username + ':' + this.connectionConfig.password
        ).toString('base64'),
    };
  }
}
