/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { probandAuthClient } from '../../../src/clients/authServerClient';

export function mockAuthClientResponse(
  sandbox: sinon.SinonSandbox,
  username: string | null = null,
  groups: string[] = []
): void {
  const stub = sandbox.stub(probandAuthClient.users);

  stub.find.resolves(username ? [{ username, id: '123' }] : []);
  stub.listGroups.resolves(groups.map((group) => ({ name: group })));
}
