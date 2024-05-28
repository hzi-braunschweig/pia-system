/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { ApiClientInteractor } from '../interactors/apiClientInteractor';
import {
  ApiClientDto,
  CreateApiClientRequestDto,
} from '../models/apiClientDto';

export class ApiClientHandler {
  public static getApiClients: Lifecycle.Method = async (): Promise<
    ApiClientDto[]
  > => {
    return await ApiClientInteractor.getApiClients();
  };

  public static postApiClient: Lifecycle.Method = async (
    request
  ): Promise<ApiClientDto> => {
    return await ApiClientInteractor.createApiClient(
      request.payload as CreateApiClientRequestDto
    );
  };

  public static deleteApiClient: Lifecycle.Method = async (
    request
  ): Promise<null> => {
    await ApiClientInteractor.deleteApiClient(
      request.params['clientId'] as string
    );
    return null;
  };
}
