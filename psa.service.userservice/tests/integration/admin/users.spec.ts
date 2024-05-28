/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import sinon, { SinonStubbedInstance } from 'sinon';
import fetchMocker from 'fetch-mock';
import { db } from '../../../src/db';
import { Server } from '../../../src/server';
import { StatusCodes } from 'http-status-codes';
import { cleanup, setup } from './users.spec.data/setup.helper';
import { config } from '../../../src/config';
import {
  AuthServerMock,
  AuthTokenMockBuilder,
  MailService,
  Response,
} from '@pia/lib-service-core';
import { ProbandDto } from '../../../src/models/proband';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { adminAuthClient } from '../../../src/clients/authServerClient';

chai.use(chaiHttp);
chai.use(sinonChai);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy1'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'researcher1@example.com',
  studies: ['QTestStudy1', 'QTestStudy2', 'QTestStudy3'],
});
const forscherHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'researcher2@example.com',
  studies: ['QTestStudy2'],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'investigationteam1@example.com',
  studies: ['QTestStudy1', 'QTestStudy3'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin1',
  studies: [],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm1@example.com',
  studies: ['QTestStudy1', 'QTestStudy3'],
});

describe('/admin/users', function () {
  const testSandbox = sinon.createSandbox();
  const suiteSandbox = sinon.createSandbox();
  const fetchMock = fetchMocker.sandbox();

  before(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    suiteSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    suiteSandbox.stub(MailService, 'sendMail').resolves(true);
    await Server.init();
  });

  after(async () => {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(() => AuthServerMock.adminRealm().returnValid());

  afterEach(() => {
    AuthServerMock.cleanAll();
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /admin/users/{pseudonym}', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 403 when a Proband tries to get someone else than himself', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .get('/admin/users/researcher1@example.com')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Proband tries to get a different proband', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .get('/admin/users/qtest-proband2')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if the user does not exist', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .get('/admin/users/nonExistingUser')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 with correct result when a Forscher tries to get a professional user', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .get('/admin/users/investigationteam1@example.com')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with correct result when a Forscher tries to get a Proband in his study', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .get('/admin/users/qtest-proband1')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband1');
      expect(result.body.complianceLabresults).to.equal(true);
      expect(result.body.study).to.equal('QTestStudy1');
    });

    it('should return HTTP 200 with correct result when a UT tries to get a Proband in his study', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .get('/admin/users/qtest-proband1')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband1');
      expect(result.body.complianceLabresults).to.equal(true);
      expect(result.body.study).to.equal('QTestStudy1');
    });

    it('should also accept pseudonyms in uppercase', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .get('/admin/users/QTest-Proband1')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband1');
    });

    it('should return HTTP 404 when a Forscher tries to get a Proband not in his study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/users/qtest-proband1')
        .set(forscherHeader2);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });
  });

  describe('GET /admin/users/ids/{ids}', function () {
    const ids = 'test-ids-000';
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return http 401 for a missing auth key', async () => {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .get('/admin/users/ids/' + ids);
      expect(result).to.have.status(401);
    });

    it('should return http 200 if user exists', async () => {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .get('/admin/users/ids/' + ids)
        .set(utHeader);
      expect(result).to.have.status(200);
      expect(result.body.pseudonym).to.equal('qtest-proband4');
      expect(result.body.study).to.equal('QTestStudy1');
    });

    it('should return 403 if role is not Untersuchungsteam', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .get('/admin/users/ids/' + ids)
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return 404 if user does not exist', async function () {
      const idsNotExisting = '25a682a1-7f4c-4394-bbb3-aa2d03896742';
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .get('/admin/users/ids/' + idsNotExisting)
        .set(utHeader);
      console.log(result.body);
      expect(result).to.have.status(404);
    });
  });

  describe('POST /admin/users', function () {
    let authClientUsersMock: SinonStubbedInstance<Users>;

    beforeEach(async function () {
      authClientUsersMock = testSandbox.stub(adminAuthClient.users);
      authClientUsersMock.create.resolves({ id: '1234' });
      authClientUsersMock.addClientRoleMappings.resolves();

      testSandbox.stub(adminAuthClient.groups, 'find').resolves([
        {
          id: 'xyz',
          name: 'QTestStudy1',
          path: '/QTestStudy1',
        },
      ]);

      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    const newUser = {
      username: 'qtest-proband_new1',
      role: 'Proband',
      compliance_labresults: 'true',
      study_accesses: [
        {
          study_id: 'QTestStudy1',
          access_level: 'read',
        },
      ],
    };

    const newUser2 = {
      username: 'QNewTestProband3',
      role: 'Proband',
      compliance_labresults: 'true',
      study_accesses: [
        {
          study_id: 'QTestStudy1',
          access_level: 'read',
        },
      ],
    };

    const newUserForscherInvalidMail = {
      username: 'thisIsNotAnEmailAddress',
      role: 'Forscher',
      study_accesses: [],
    };

    const newUserForscher = {
      username: 'forscher_new1@example.com',
      role: 'Forscher',
      study_accesses: [
        {
          study_id: 'QTestStudy1',
          access_level: 'write',
        },
      ],
    };

    const newUserProbandenManager = {
      username: 'pm@test.de',
      role: 'ProbandenManager',
      study_accesses: [],
    };

    const newUserEinwilligungsManager = {
      username: 'em@test.de',
      role: 'EinwilligungsManager',
      study_accesses: [],
    };

    const newUserUntersuchungsTeam = {
      username: 'ut@test.de',
      role: 'Untersuchungsteam',
      study_accesses: [],
    };

    const newUserProbandenManagerUppercase = {
      username: 'ProbandenManager@Test.de',
      role: 'ProbandenManager',
      study_accesses: [],
    };

    it('should return HTTP 403 when a Proband tries', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(probandHeader1)
        .send(newUserForscher);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Forscher tries', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(forscherHeader1)
        .send(newUserForscher);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Untersuchungsteam tries to add a Forscher', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(utHeader)
        .send(newUserForscher);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Untersuchungsteam tries to add a Proband via this route', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(utHeader)
        .send(newUser);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 409 when a SysSdmin tries to add a Forscher with invalid email', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(sysadminHeader)
        .send(newUserForscherInvalidMail);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return 409 if user with username already exists', async () => {
      // Arrange
      authClientUsersMock.count.resolves(1);

      // Act
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(sysadminHeader)
        .send(newUserForscher);

      // Assert
      expect(result).to.have.status(StatusCodes.CONFLICT);
    });

    it('should return HTTP 200 without the created new password if the Sysadmin creates a new Forscher', async function () {
      // Arrange
      testSandbox.stub(adminAuthClient.roles, 'findOneByName').resolves({
        id: 'abc-123',
        name: 'Forscher',
      });

      // Act
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(sysadminHeader)
        .send(newUserForscher);

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);

      expect(authClientUsersMock.create).to.be.calledOnceWith({
        realm: 'pia-admin-realm',
        username: newUserForscher.username,
        email: newUserForscher.username,
        groups: ['/QTestStudy1'],
        enabled: true,
        credentials: [
          { type: 'password', value: sinon.match.any, temporary: true },
        ],
      });
      expect(authClientUsersMock.addRealmRoleMappings).to.be.calledOnceWith({
        id: '1234',
        realm: 'pia-admin-realm',
        roles: [{ id: 'abc-123', name: 'Forscher' }],
      });
    });

    it('should return HTTP 200 without the created new password if the Sysadmin creates a new Untersuchungsteam', async function () {
      // Arrange
      testSandbox.stub(adminAuthClient.roles, 'findOneByName').resolves({
        id: 'abc-123',
        name: 'Untersuchungsteam',
      });

      // Act
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(sysadminHeader)
        .send(newUserUntersuchungsTeam);

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      expect(authClientUsersMock.create).to.be.calledOnceWith({
        realm: 'pia-admin-realm',
        username: newUserUntersuchungsTeam.username,
        email: newUserUntersuchungsTeam.username,
        groups: [],
        enabled: true,
        credentials: [
          { type: 'password', value: sinon.match.any, temporary: true },
        ],
      });
      expect(authClientUsersMock.addRealmRoleMappings).to.be.calledOnceWith({
        id: '1234',
        realm: 'pia-admin-realm',
        roles: [{ id: 'abc-123', name: 'Untersuchungsteam' }],
      });
    });

    it('should return HTTP 200 without the created new password if the Sysadmin creates a new ProbandenManager', async function () {
      // Arrange
      testSandbox.stub(adminAuthClient.roles, 'findOneByName').resolves({
        id: 'abc-123',
        name: 'ProbandenManager',
      });

      // Act
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(sysadminHeader)
        .send(newUserProbandenManager);

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      expect(authClientUsersMock.create).to.be.calledOnceWith({
        realm: 'pia-admin-realm',
        username: newUserProbandenManager.username,
        email: newUserProbandenManager.username,
        groups: [],
        enabled: true,
        credentials: [
          { type: 'password', value: sinon.match.any, temporary: true },
        ],
      });
      expect(authClientUsersMock.addRealmRoleMappings).to.be.calledOnceWith({
        id: '1234',
        realm: 'pia-admin-realm',
        roles: [{ id: 'abc-123', name: 'ProbandenManager' }],
      });
    });

    it('should return HTTP 200 without the created new password if the Sysadmin creates a new EinwilligungsManager', async function () {
      // Arrange
      testSandbox.stub(adminAuthClient.roles, 'findOneByName').resolves({
        id: 'abc-123',
        name: 'EinwilligungsManager',
      });

      // Act
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(sysadminHeader)
        .send(newUserEinwilligungsManager);

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      expect(authClientUsersMock.create).to.be.calledOnceWith({
        realm: 'pia-admin-realm',
        username: newUserEinwilligungsManager.username,
        email: newUserEinwilligungsManager.username,
        groups: [],
        enabled: true,
        credentials: [
          { type: 'password', value: sinon.match.any, temporary: true },
        ],
      });
      expect(authClientUsersMock.addRealmRoleMappings).to.be.calledOnceWith({
        id: '1234',
        realm: 'pia-admin-realm',
        roles: [{ id: 'abc-123', name: 'EinwilligungsManager' }],
      });
    });

    it('should return HTTP 409 if the Sysadmin creates a new Proband', async function () {
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(sysadminHeader)
        .send(newUser2);
      expect(result).to.have.status(400);
    });

    it('should convert username to lowercase', async function () {
      // Arrange
      testSandbox.stub(adminAuthClient.roles, 'findOneByName').resolves({
        id: 'abc-123',
        name: 'ProbandenManager',
      });

      // Act
      const result: Response<ProbandDto> = await chai
        .request(apiAddress)
        .post('/admin/users')
        .set(sysadminHeader)
        .send(newUserProbandenManagerUppercase);

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      expect(authClientUsersMock.create).to.be.calledOnce;
      expect(authClientUsersMock.addRealmRoleMappings).to.be.calledOnceWith({
        id: '1234',
        realm: 'pia-admin-realm',
        roles: [{ id: 'abc-123', name: 'ProbandenManager' }],
      });
    });
  });

  describe('PATCH /admin/users/{pseudonym}', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    const markAsTestproband = {
      is_test_proband: true,
    };

    it('should return HTTP 200 when a Untersuchungsteam marks TestProband1 as Test Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .patch('/admin/users/qtest-proband1')
        .set(utHeader)
        .send(markAsTestproband);
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
    });

    it('should also accept pseudonyms in uppercase', async function () {
      const result = await chai
        .request(apiAddress)
        .patch('/admin/users/QTest-Proband1')
        .set(utHeader)
        .send(markAsTestproband);
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
    });

    it('should return HTTP 403 when a Proband marks TestProband1 as Test Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .patch('/admin/users/qtest-proband1')
        .set(probandHeader1)
        .send(markAsTestproband);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a System Admin marks TestProband1 as Test Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .patch('/admin/users/qtest-proband1')
        .set(sysadminHeader)
        .send(markAsTestproband);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 500 when a ut marks deleted proband as testprband', async function () {
      const result = await chai
        .request(apiAddress)
        .patch('/admin/users/qtest-proband2')
        .set(utHeader)
        .send(markAsTestproband);
      expect(result).to.have.status(500);
    });

    it('should return HTTP 500 when a ut marks deactivated proband as testprband', async function () {
      const result = await chai
        .request(apiAddress)
        .patch('/admin/users/qtest-proband3')
        .set(utHeader)
        .send(markAsTestproband);
      expect(result).to.have.status(500);
    });

    it('should return HTTP 403 when a Proband Manager marks TestProband1 as Test Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .patch('/admin/users/qtest-proband1')
        .set(pmHeader)
        .send(markAsTestproband);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a researcher marks TestProband1 as Test Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .patch('/admin/users/qtest-proband1')
        .set(forscherHeader1)
        .send(markAsTestproband);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });
  });

  describe('DELETE /admin/users/{username}', function () {
    let authClientUsersStub: SinonStubbedInstance<Users>;

    beforeEach(async function () {
      authClientUsersStub = testSandbox.stub(adminAuthClient.users);
      authClientUsersStub.find.resolves([
        {
          id: '1',
          username: 'researcher1@example.com',
        },
        {
          id: '2',
          username: 'pm3@example.com',
        },
        {
          id: '3',
          username: 'investigationteam1@example.com',
        },
        {
          id: '4',
          username: 'sysadmin1@example.com',
        },
      ]);
      authClientUsersStub.listRealmRoleMappings.resolves([
        {
          name: 'Forscher',
        },
      ]);
      authClientUsersStub.del.resolves();

      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    it('should return HTTP 403 when a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/users/researcher1@example.com')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/users/researcher1@example.com')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/users/researcher1@example.com')
        .set(utHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a SysAdmin tries to delete another SysAdmin', async function () {
      authClientUsersStub.listRealmRoleMappings.resolves([
        {
          name: 'SysAdmin',
        },
      ]);
      const result = await chai
        .request(apiAddress)
        .delete('/admin/users/sysadmin1@example.com')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if the user does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/users/nonExistingUser')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 403 if a ProbandenManager tries to delete a Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/users/researcher1@example.com')
        .set(pmHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and delete the user of role Forscher and all its data', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/users/researcher1@example.com')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
    });

    it('should return HTTP 200 and delete the user of role ProbandenManager and all its data', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/users/pm3@example.com')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      const user = await db.oneOrNone<{ username: string }>(
        "SELECT user_id FROM study_users WHERE user_id = 'pm3@example.com'"
      );
      expect(user).to.be.null;
    });

    it('should return HTTP 200 and delete the user of role Untersuchungsteam and all its data', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/users/investigationteam1@example.com')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);

      const user = await db.oneOrNone<{ username: string }>(
        "SELECT user_id FROM study_users WHERE user_id = 'investigationteam1@example.com'"
      );
      expect(user).to.be.null;
    });

    it('should also accept pseudonyms in uppercase', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/users/InvestigationTeam1@Example.com')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
    });
  });
});
