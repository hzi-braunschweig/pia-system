/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { SinonSandbox, SinonStubbedInstance } from 'sinon';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { Clients } from '@keycloak/keycloak-admin-client/lib/resources/clients';
import { adminAuthClient } from '../../src/clients/authServerClient';
import { Groups } from '@keycloak/keycloak-admin-client/lib/resources/groups';

export function mockGetApiClients(sandbox: SinonSandbox): void {
  const clientsStub: SinonStubbedInstance<Clients> = sandbox.stub(
    adminAuthClient.clients
  );
  clientsStub.find.resolves([
    {
      id: '1',
      clientId: 'pia-public-api-test-1',
      name: 'Test 1',
      secret: 'secret',
      attributes: {
        'pia.createdAt': '2021-01-01',
      },
    },
    {
      id: '2',
      clientId: 'pia-public-api-test-2',
      name: 'Test 2',
      secret: 'secret',
      attributes: {
        'pia.createdAt': '2023-12-31',
      },
    },
  ]);
  clientsStub.getServiceAccountUser.resolves({
    id: '2001',
  });
  const usersStub: SinonStubbedInstance<Users> = sandbox.stub(
    adminAuthClient.users
  );
  usersStub.listGroups.resolves([
    {
      id: '1001',
      name: 'test-study-1',
    },
    {
      id: '1002',
      name: 'test-study-2',
    },
  ]);
}

export function mockCreateApiClient(sandbox: SinonSandbox): void {
  const clientsStub: SinonStubbedInstance<Clients> = sandbox.stub(
    adminAuthClient.clients
  );
  clientsStub.create.resolves({
    id: '1001',
  });

  // addGroupMembershipsToTokenOfClient
  clientsStub.addProtocolMapper.resolves();

  // addGroupMembershipsToClient
  clientsStub.getServiceAccountUser.resolves({
    id: '2001',
  });
  const groupsStub: SinonStubbedInstance<Groups> = sandbox.stub(
    adminAuthClient.groups
  );
  groupsStub.find.resolves([
    {
      id: '3001',
      name: 'test-study-1',
    },
    {
      id: '3002',
      name: 'test-study-2',
    },
  ]);
  const usersStub: SinonStubbedInstance<Users> = sandbox.stub(
    adminAuthClient.users
  );
  usersStub.addToGroup.resolves();

  // getApiClient
  clientsStub.findOne.resolves({
    id: '1',
    clientId: 'pia-public-api-test-1',
    name: 'Test 1',
    secret: 'secret',
    attributes: {
      'pia.createdAt': '2024-01-01',
    },
  });
  usersStub.listGroups.resolves([
    {
      id: '3001',
      name: 'test-study-1',
    },
    {
      id: '3002',
      name: 'test-study-2',
    },
  ]);
}

export function mockCreateApiClientConflict(sandbox: SinonSandbox): void {
  const clientsStub: SinonStubbedInstance<Clients> = sandbox.stub(
    adminAuthClient.clients
  );
  clientsStub.create.rejects({
    response: {
      status: 409,
    },
  });
}

export function mockDeleteApiClientWithEmptyResponse(
  sandbox: SinonSandbox
): void {
  const clientsStub: SinonStubbedInstance<Clients> = sandbox.stub(
    adminAuthClient.clients
  );
  clientsStub.find.resolves([]);
}

export function mockDeleteApiClient(sandbox: SinonSandbox): void {
  const clientsStub: SinonStubbedInstance<Clients> = sandbox.stub(
    adminAuthClient.clients
  );
  clientsStub.find.resolves([
    {
      id: '1',
      clientId: 'pia-public-api-test-1',
      name: 'Test 1',
      secret: 'secret',
    },
    {
      id: '2',
      clientId: 'pia-public-api-test-2',
      name: 'Test 2',
      secret: 'secret',
    },
  ]);
  clientsStub.del.resolves();
}
