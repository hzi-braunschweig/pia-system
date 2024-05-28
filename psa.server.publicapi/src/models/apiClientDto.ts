/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface ApiClient {
  clientId: string;
  name: string;
  studies: string[];
  secret: string;
  createdAt: string;
}

export type ApiClientDto = ApiClient;

export type CreateApiClientRequestDto = Pick<ApiClient, 'name' | 'studies'>;
