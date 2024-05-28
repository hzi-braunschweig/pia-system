/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface ApiClientDto {
  clientId: string;
  name: string;
  studies: string[];
  secret: string;
  createdAt: string;
}

export type CreateApiClientRequestDto = Pick<ApiClientDto, 'name' | 'studies'>;
