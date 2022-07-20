/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SinonSandbox, SinonStubbedInstance } from 'sinon';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { probandAuthClient } from '../../src/clients/authServerClient';

export function mockUpdateAccountMailAddress(
  username: string,
  sandbox: SinonSandbox
): void {
  const authClientUsersStub: SinonStubbedInstance<Users> = sandbox.stub(
    probandAuthClient.users
  );
  authClientUsersStub.find.resolves([{ username, id: '1234' }]);
  authClientUsersStub.update.resolves();
}
