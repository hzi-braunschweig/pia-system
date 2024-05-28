/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ApiClientService } from '../services/apiClientService';
import {
  ApiClientDto,
  CreateApiClientRequestDto,
} from '../models/apiClientDto';
import { ApiClientNotFoundError } from '../errors';

export class ApiClientInteractor {
  public static async getApiClients(): Promise<ApiClientDto[]> {
    return ApiClientService.getApiClients();
  }

  public static async createApiClient(
    client: CreateApiClientRequestDto
  ): Promise<ApiClientDto> {
    return ApiClientService.createApiClient(client);
  }

  public static async deleteApiClient(clientId: string): Promise<void> {
    try {
      return await ApiClientService.deleteApiClient(clientId);
    } catch (error) {
      if (error instanceof ApiClientNotFoundError) {
        throw error;
      }
      console.error(error);
      throw new Error('Could not delete api client due to an unknown error');
    }
  }
}
