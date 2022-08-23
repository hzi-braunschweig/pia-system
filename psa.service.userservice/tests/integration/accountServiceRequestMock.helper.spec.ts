/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SinonSandbox, SinonStubbedInstance } from 'sinon';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import {
  adminAuthClient,
  probandAuthClient,
} from '../../src/clients/authServerClient';
import { ProfessionalAccount } from '../../src/models/account';
import { Groups } from '@keycloak/keycloak-admin-client/lib/resources/groups';
import { ProfessionalRole } from '../../src/models/role';
import { Roles } from '@keycloak/keycloak-admin-client/lib/resources/roles';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';

export function mockGetProfessionalAccount(
  sandbox: SinonSandbox,
  { username, role, studies }: ProfessionalAccount
): SinonStubbedInstance<Users> {
  const authClientUsersStub: SinonStubbedInstance<Users> = sandbox.stub(
    adminAuthClient.users
  );
  authClientUsersStub.find.resolves([
    {
      username,
      id: '1234',
    },
  ]);
  authClientUsersStub.listGroups.resolves(
    studies.map((name) => ({
      name,
    }))
  );
  authClientUsersStub.listRealmRoleMappings.resolves([
    {
      name: role,
    },
  ]);
  return authClientUsersStub;
}

export function mockGetProbandAccount(
  sandbox: SinonSandbox,
  username: string,
  study: string
): SinonStubbedInstance<Users> {
  const authClientUsersStub: SinonStubbedInstance<Users> = sandbox.stub(
    probandAuthClient.users
  );
  authClientUsersStub.find.resolves([
    {
      username,
      id: '1234',
    },
  ]);
  authClientUsersStub.listGroups.resolves([
    {
      name: study,
    },
  ]);
  return authClientUsersStub;
}

export function mockGetProbandAccountsByStudyName(
  sandbox: SinonSandbox,
  studies: string[],
  pseudonyms: string[]
): SinonStubbedInstance<Groups> {
  const authClientGroupsStub = sandbox.stub(probandAuthClient.groups);
  authClientGroupsStub.find.resolves(
    studies.map((studyName) => ({
      name: studyName,
      id: 'abc',
      path: '/' + studyName,
    }))
  );
  authClientGroupsStub.listMembers.resolves(
    pseudonyms.map((username) => ({ id: '1234', username }))
  );
  return authClientGroupsStub;
}

export function mockDeleteProbandAccount(
  sandbox: SinonSandbox,
  pseudonyms: string[]
): SinonStubbedInstance<Users> {
  const authClientUsersStub: SinonStubbedInstance<Users> = sandbox.stub(
    probandAuthClient.users
  );
  authClientUsersStub.find.resolves(
    pseudonyms.map((pseudonym) => ({
      username: pseudonym,
      id: '1',
    }))
  );
  authClientUsersStub.del.resolves();
  return authClientUsersStub;
}

export function mockGetProfessionalAccountsByRole(
  sandbox: SinonSandbox
): SinonStubbedInstance<Users> {
  const authClientRolesStub: SinonStubbedInstance<Roles> = sandbox.stub(
    adminAuthClient.roles
  );
  authClientRolesStub.findUsersWithRole.callsFake(async (payload) => {
    const roleMappings: Record<string, UserRepresentation[]> = {
      ProbandenManager: [
        {
          username: 'pm1@example.com',
          id: '1',
        },
        {
          username: 'pm2@example.com',
          id: '2',
        },
      ],
      Forscher: [
        {
          username: 'forscher1@example.com',
          id: '3',
        },
        {
          username: 'forscher2@example.com',
          id: '4',
        },
        {
          username: 'forscher3@example.com',
          id: '9',
        },
      ],
      Untersuchungsteam: [
        {
          username: 'ut1@example.com',
          id: '5',
        },
        {
          username: 'ut2@example.com',
          id: '6',
        },
      ],
      SysAdmin: [
        {
          username: 'sysadmin1@example.com',
          id: '7',
        },
        {
          username: 'SysAdmin2',
          id: '8',
        },
      ],
    };
    return Promise.resolve(roleMappings[payload?.name ?? ''] ?? []);
  });

  const authClientUsersStub: SinonStubbedInstance<Users> = sandbox.stub(
    adminAuthClient.users
  );
  authClientUsersStub.listRealmRoleMappings.callsFake(async (payload) => {
    const roleMappings: Record<string, ProfessionalRole> = {
      1: 'ProbandenManager',
      2: 'ProbandenManager',
      3: 'Forscher',
      4: 'Forscher',
      5: 'Untersuchungsteam',
      6: 'Untersuchungsteam',
      7: 'SysAdmin',
      8: 'SysAdmin',
      9: 'Forscher',
    };
    return Promise.resolve([
      {
        name: roleMappings[payload?.id ?? 0],
      },
    ]);
  });

  authClientUsersStub.listGroups.callsFake(async (payload) => {
    const groupMappings: Record<string, string[]> = {
      1: ['TestStudy', 'AnotherStudy'],
      2: [],
      3: ['TestStudy'],
      4: ['AnotherStudy'],
      5: ['TestStudy', 'AnotherStudy'],
      6: ['TestStudy', 'AnotherStudy'],
      7: [],
      8: [],
      9: ['AnotherStudy'],
    };
    return Promise.resolve(
      (groupMappings[payload?.id ?? 0] ?? []).map((group) => ({ name: group }))
    );
  });
  return authClientUsersStub;
}

export function mockGetProfessionalAccountsByStudyName(
  sandbox: SinonSandbox
): SinonStubbedInstance<Users> {
  const authClientGroupsStub = sandbox.stub(adminAuthClient.groups);
  authClientGroupsStub.find.resolves([
    { name: 'TestStudy', id: 'abc', path: '/TestStudy' },
    { name: 'AnotherStudy', id: 'def', path: '/AnotherStudy' },
  ]);
  authClientGroupsStub.listMembers.callsFake(async (payload) => {
    let members: UserRepresentation[] = [];

    const membersMap = new Map<string, UserRepresentation[]>([
      [
        'abc',
        [
          {
            username: 'pm1@example.com',
            id: '1',
          },
          {
            username: 'pm2@example.com',
            id: '2',
          },
          {
            username: 'forscher1@example.com',
            id: '3',
          },
          {
            username: 'forscher2@example.com',
            id: '4',
          },
          {
            username: 'ut1@example.com',
            id: '5',
          },
          {
            username: 'ut2@example.com',
            id: '6',
          },
          {
            username: 'forscher3@example.com',
            id: '7',
          },
        ],
      ],
      [
        'def',
        [
          {
            username: 'forscher3@example.com',
            id: '7',
          },
          {
            username: 'forscher4@example.com',
            id: '8',
          },
        ],
      ],
    ]);

    const id = payload?.id ?? null;

    if (id === null) {
      members = [
        ...(membersMap.get('abc') ?? []),
        ...(membersMap.get('def') ?? []),
      ];
    } else {
      members = membersMap.get(id) ?? [];
    }

    return Promise.resolve(members);
  });

  const authClientUsersStub: SinonStubbedInstance<Users> = sandbox.stub(
    adminAuthClient.users
  );
  authClientUsersStub.listRealmRoleMappings.callsFake(async (payload) => {
    const roleMappings: Record<string, ProfessionalRole> = {
      1: 'ProbandenManager',
      2: 'ProbandenManager',
      3: 'Forscher',
      4: 'Forscher',
      5: 'Untersuchungsteam',
      6: 'Untersuchungsteam',
      7: 'Forscher',
      8: 'Forscher',
    };
    return Promise.resolve([
      {
        name: roleMappings[payload?.id ?? 0],
      },
    ]);
  });
  authClientUsersStub.listGroups.callsFake(async (payload) => {
    const groupMappings: Record<string, string[]> = {
      1: ['TestStudy', 'AnotherStudy'],
      2: ['TestStudy'],
      3: ['TestStudy'],
      4: ['TestStudy', 'AnotherStudy'],
      5: ['TestStudy', 'AnotherStudy'],
      6: ['TestStudy', 'AnotherStudy'],
      7: ['TestStudy', 'AnotherStudy'],
      8: ['AnotherStudy'],
    };
    return Promise.resolve(
      (groupMappings[payload?.id ?? 0] ?? []).map((group) => ({ name: group }))
    );
  });
  return authClientUsersStub;
}

export function mockRealmRoleMapping(
  sandbox: SinonSandbox
): SinonStubbedInstance<Groups> {
  const authClientGroupsStub = sandbox.stub(adminAuthClient.groups);
  authClientGroupsStub.find.resolves([
    { name: 'QTestStudy1', id: 'abc', path: '/QTestStudy1' },
    { name: 'QTestStudy2', id: 'abc', path: '/QTestStudy2' },
    { name: 'QTestStudy3', id: 'def', path: '/QTestStudy3' },
    { name: 'NewQTestStudy1', id: 'cde', path: '/NewQTestStudy1' },
    { name: 'NewQTestStudy2', id: 'cde', path: '/NewQTestStudy2' },
    { name: 'NewQTestStudy3', id: 'cde', path: '/NewQTestStudy3' },
  ]);
  authClientGroupsStub.listRealmRoleMappings.resolves([
    { id: 'abc', name: 'feature:RequireTotp' },
  ]);

  const authClientRolesStub = sandbox.stub(adminAuthClient.roles);
  authClientRolesStub.findOneByName.resolves({
    id: 'abc',
    name: 'feature:RequireTotp',
  });
  authClientGroupsStub.addRealmRoleMappings.resolves();
  authClientGroupsStub.delRealmRoleMappings.resolves();
  return authClientGroupsStub;
}
