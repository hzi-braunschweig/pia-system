/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import { StatusCodes } from 'http-status-codes';

import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './studyAccesses.spec.data/setup.helper';
import { createSandbox, SinonStubbedInstance } from 'sinon';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { Groups } from '@keycloak/keycloak-admin-client/lib/resources/groups';
import { adminAuthClient } from '../../src/clients/authServerClient';

chai.use(chaiHttp);
chai.use(sinonChai);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy1'],
});
const forscherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['QTestStudy3', 'QTestStudy1'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin',
  studies: [],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: ['QTestStudy1'],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['QTestStudy1'],
});

const testSandbox = createSandbox();

describe('/admin/studies/{studyName}/accesses', function () {
  let authClientUsersStub: SinonStubbedInstance<Users>;
  let authClientGroupsStub: SinonStubbedInstance<Groups>;

  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  beforeEach(async () => {
    authClientUsersStub = testSandbox.stub(adminAuthClient.users);
    authClientGroupsStub = testSandbox.stub(adminAuthClient.groups);
    authClientUsersStub.find.resolves([
      {
        username: 'qtest-forscher1',
        id: '1234',
      },
      {
        username: 'qtest-forscher2',
        id: '1235',
      },
      {
        username: 'qtest-sysadmin2',
        id: '1236',
      },
    ]);
    authClientUsersStub.addToGroup.resolves();
    authClientUsersStub.delFromGroup.resolves();
    authClientUsersStub.listRealmRoleMappings.resolves([
      {
        name: 'Forscher',
      },
    ]);
    authClientGroupsStub.find.resolves([
      {
        id: 'abc',
        name: 'QTestStudy1',
        path: '/QTestStudy1',
      },
    ]);

    AuthServerMock.adminRealm().returnValid();
    AuthServerMock.probandRealm().returnValid();
    await setup();
  });

  afterEach(async () => {
    testSandbox.restore();
    AuthServerMock.cleanAll();
    await cleanup();
  });

  describe('POST /admin/studies/{studyName}/accesses', function () {
    const invalidStudyAccess = {
      username: 'qtest-forscher1',
      accessLevel: 'somethinginvalid',
    };

    const validStudyAccessForscher = {
      username: 'qtest-forscher1',
      accessLevel: 'read',
    };

    const studyAccessWrongUser = {
      username: 'NoValidUser',
      accessLevel: 'read',
    };

    const validStudyAccessForscherUppercase = {
      username: 'QTest-Forscher1',
      accessLevel: 'read',
    };

    const studyAccessSysAdmin = {
      username: 'qtest-sysadmin2',
      accessLevel: 'admin',
    };

    const existingStudyAccessForscher = {
      username: 'qtest-forscher2',
      accessLevel: 'read',
    };

    it('should return HTTP 400 if the payload is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies/QTestStudy1/accesses')
        .set(sysadminHeader)
        .send(invalidStudyAccess);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 404 if the study does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies/NoValidStudy/accesses')
        .set(sysadminHeader)
        .send(validStudyAccessForscher);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 404 if the user does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies/QTestStudy1/accesses')
        .set(sysadminHeader)
        .send(studyAccessWrongUser);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies/QTestStudy1/accesses')
        .set(forscherHeader)
        .send(validStudyAccessForscher);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 403 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies/QTestStudy1/accesses')
        .set(pmHeader)
        .send(validStudyAccessForscher);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 403 if a UntersuchungsTeam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies/QTestStudy1/accesses')
        .set(utHeader)
        .send(validStudyAccessForscher);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 403 and refuse to create a study access for another SysAdmin', async function () {
      authClientUsersStub.listRealmRoleMappings.resolves([
        {
          name: 'SysAdmin',
        },
      ]);

      const result = await chai
        .request(apiAddress)
        .post('/admin/studies/QTestStudy1/accesses')
        .set(sysadminHeader)
        .send(studyAccessSysAdmin);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 409 if study access for user and study already exists', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies/QTestStudy1/accesses')
        .set(sysadminHeader)
        .send(existingStudyAccessForscher);
      expect(result).to.have.status(StatusCodes.CONFLICT);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 200 and create the study access for SysAdmin', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies/QTestStudy1/accesses')
        .set(sysadminHeader)
        .send(validStudyAccessForscher);

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.studyName).to.equal('QTestStudy1');
      expect(result.body.username).to.equal('qtest-forscher1');
      expect(result.body.accessLevel).to.equal('read');
      expect(authClientUsersStub.addToGroup).to.have.been.calledOnceWith({
        id: '1234',
        groupId: 'abc',
        realm: 'pia-admin-realm',
      });
    });

    it('should also accept usernames in uppercase and return HTTP 200', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies/QTestStudy1/accesses')
        .set(sysadminHeader)
        .send(validStudyAccessForscherUppercase);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.username).to.equal('qtest-forscher1');
      expect(authClientUsersStub.addToGroup).to.have.been.calledOnceWith({
        id: '1234',
        groupId: 'abc',
        realm: 'pia-admin-realm',
      });
    });
  });

  describe('PUT /admin/studies/{studyName}/accesses/{username}', function () {
    const invalidStudyAccess = {
      accessLevel: 'somethinginvalid',
    };

    const studyAccessSysAdmin = {
      username: 'qtest-sysadmin2',
      accessLevel: 'admin',
    };

    const validStudyAccess = {
      accessLevel: 'admin',
    };

    const validStudyAccessForscher = {
      accessLevel: 'read',
    };

    it('should return HTTP 400 if the payload is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/accesses/qtest-forscher1')
        .set(sysadminHeader)
        .send(invalidStudyAccess);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 404 if the study does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/NoValidStudy/accesses/qtest-forscher1')
        .set(sysadminHeader)
        .send(validStudyAccessForscher);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 404 if the study access does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/accesses/qtest-forscher1')
        .set(sysadminHeader)
        .send(validStudyAccessForscher);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 404 if the user does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/accesses/NoValidUser')
        .set(sysadminHeader)
        .send(validStudyAccess);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/accesses/qtest-forscher1')
        .set(probandHeader1)
        .send(validStudyAccess);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/accesses/qtest-forscher1')
        .set(forscherHeader)
        .send(validStudyAccess);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 403 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/accesses/qtest-forscher1')
        .set(pmHeader)
        .send(validStudyAccess);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 403 if a UntersuchungsTeam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/accesses/qtest-forscher1')
        .set(utHeader)
        .send(validStudyAccess);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
      expect(authClientUsersStub.addToGroup).not.to.have.been.called;
    });

    it('should return HTTP 403 and refuse to change a study access for another SysAdmin', async function () {
      authClientUsersStub.listRealmRoleMappings.resolves([
        {
          name: 'SysAdmin',
        },
      ]);

      const result = await chai
        .request(apiAddress)
        .post('/admin/studies/QTestStudy1/accesses')
        .set(sysadminHeader)
        .send(studyAccessSysAdmin);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and change the study access data for a Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/accesses/qtest-forscher2')
        .set(sysadminHeader)
        .send(validStudyAccess);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.studyName).to.equal('QTestStudy1');
      expect(result.body.username).to.equal('qtest-forscher2');
      expect(result.body.accessLevel).to.equal('admin');
    });

    it('should also accept usernames in uppercase and return HTTP 200', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/accesses/QTest-Forscher2')
        .set(sysadminHeader)
        .send(validStudyAccess);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.username).to.equal('qtest-forscher2');
    });
  });

  describe('DELETE /admin/studies/{studyName}/accesses/{username}', function () {
    it('should return HTTP 404 if the study access does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/studies/QTestStudy1/accesses/qtest-forscher1')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/studies/QTestStudy1/accesses/qtest-forscher2')
        .set(forscherHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/studies/QTestStudy1/accesses/qtest-forscher2')
        .set(pmHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a UntersuchungsTeam tries for a Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/studies/QTestStudy1/accesses/qtest-forscher2')
        .set(utHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 and refuse to delete the study access for Untersuchungsteam', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/studies/QTestStudy1/accesses/qtest-forscher2')
        .set(utHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 and refuse to delete the study access of a SysAdmin', async function () {
      authClientUsersStub.listRealmRoleMappings.resolves([
        {
          name: 'SysAdmin',
        },
      ]);

      const result = await chai
        .request(apiAddress)
        .delete('/admin/studies/QTestStudy1/accesses/qtest-sysadmin2')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and delete the study access for SysAdmin', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/studies/QTestStudy1/accesses/qtest-forscher2')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
    });

    it('should should also accept usernames in lowercase and return HTTP 200', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/studies/QTestStudy1/accesses/QTest-Forscher2')
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
    });
  });
});
