/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@pia-system/lib-http-clients-internal';
import fetchMocker from 'fetch-mock';
import { SinonSandbox } from 'sinon';

export function mockCompliance(
  fetchMockSandbox: fetchMocker.FetchMockSandbox,
  study: string,
  user: string,
  type: string,
  value: unknown
): void {
  fetchMockSandbox.get(
    {
      url: 'express:/compliance/:study/agree/:user',
      params: { study, user },
      query: { system: type },
      name: study + user + type,
    },
    String(value),
    {
      overwriteRoutes: true,
    }
  );
}

export function setupFetchMock(
  testSandbox: SinonSandbox,
  fetchMockSandbox: fetchMocker.FetchMockSandbox
): void {
  testSandbox
    .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .callsFake(fetchMockSandbox);
}
