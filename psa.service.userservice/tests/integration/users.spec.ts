/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import fetchMocker from 'fetch-mock';
import fetch from 'node-fetch';
import secretOrPrivateKey from '../secretOrPrivateKey';
import JWT from 'jsonwebtoken';
import { db } from '../../src/db';
import server from '../../src/server';
import personaldataserviceClient from '../../src/clients/personaldataserviceClient';
import { StatusCodes } from 'http-status-codes';
import { cleanup, setup } from './users.spec.data/setup.helper';
import { config } from '../../src/config';
import {
  AccountStatus,
  ProbandResponseForPm,
  ProbandResponseForProfessionals,
  User,
  UserResponse,
  UserWithStudyAccess,
} from '../../src/models/user';
import { Response as SuperagentResponse } from 'superagent';
import { assert } from 'ts-essentials';
import { MailService } from '@pia/lib-service-core';

type Response<T> = Omit<SuperagentResponse, 'body'> & {
  body: T & { links: { self: { href: string } } };
};

chai.use(chaiHttp);
const apiAddress = `http://localhost:${config.public.port}/user`;

const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'researcher1@example.com',
};
const forscherSession2 = {
  id: 1,
  role: 'Forscher',
  username: 'researcher2@example.com',
};
const forscherSession4 = {
  id: 1,
  role: 'Forscher',
  username: 'researcher4@example.com',
};
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'investigationteam1@example.com',
};
const sysadminSession = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSystemAdmin1',
};
const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm1@example.com',
};

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
  expiresIn: '24h',
});
const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken1 = JWT.sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken2 = JWT.sign(forscherSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken4 = JWT.sign(forscherSession4, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken = JWT.sign(utSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken = JWT.sign(sysadminSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken = JWT.sign(pmSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const forscherHeader1 = { authorization: forscherToken1 };
const forscherHeader2 = { authorization: forscherToken2 };
const forscherHeader4 = { authorization: forscherToken4 };
const utHeader = { authorization: utToken };
const sysadminHeader = { authorization: sysadminToken };
const pmHeader = { authorization: pmToken };

describe('/user/users', function () {
  const testSandbox = sinon.createSandbox();
  const suiteSandbox = sinon.createSandbox();
  const fetchMock = fetchMocker.sandbox();

  function mockAuthserviceCreateUser(): void {
    fetchMock.post('express:/auth/user', async (_url, opts) => {
      const user = JSON.parse(opts.body as string) as User;
      try {
        await db.none(
          "INSERT INTO users(username,role,password) VALUES ($(username), 'Proband','')",
          user
        );
        delete user.password;
        return user;
      } catch (e) {
        return StatusCodes.CONFLICT;
      }
    });
  }

  before(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    suiteSandbox.stub(fetch, 'default').callsFake(fetchMock);
    suiteSandbox.stub(MailService, 'sendMail').resolves(true);
    await server.init();
  });

  after(async () => {
    await server.stop();
    suiteSandbox.restore();
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /users', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });
    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/users')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/users')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with probands from study 2 for Forscher', async function () {
      const result: Response<{ users: ProbandResponseForProfessionals[] }> =
        await chai.request(apiAddress).get('/users').set(forscherHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.users.length).to.equal(2);
      const proband2 = result.body.users.find(
        (user) => user.username === 'QTestProband2'
      );
      assert(proband2);
      expect(proband2.username).to.equal('QTestProband2');
      expect(proband2.role).to.equal('Proband');
      expect(proband2.first_logged_in_at).to.equal(null);
      expect(proband2).to.not.have.own.property('password');
      expect(proband2.compliance_labresults).to.equal(true);
      expect(proband2.study_accesses.length).to.equal(1);
      assert(proband2.study_accesses[0]);
      expect(proband2.study_accesses[0].study_id).to.equal('QTestStudy2');
      expect(proband2.study_accesses[0].access_level).to.equal('read');
      expect(result.body.links.self.href).to.equal('/users');
    });

    it('should return HTTP 200 with probands from study 1 and 2 for Forscher', async function () {
      const result: Response<{ users: ProbandResponseForProfessionals[] }> =
        await chai.request(apiAddress).get('/users').set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.users.length).to.equal(5);
      expect(result.body.links.self.href).to.equal('/users');
    });

    it('should return HTTP 200 with all Probands for Untersuchungsteam', async function () {
      const result: Response<{ users: ProbandResponseForProfessionals[] }> =
        await chai.request(apiAddress).get('/users').set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.users.length).to.equal(3);
      const proband1 = result.body.users.find(
        (user) => user.username === 'QTestProband1'
      );
      assert(proband1);
      expect(proband1.username).to.equal('QTestProband1');
      expect(proband1.first_logged_in_at).to.not.equal(undefined);
      expect(proband1).to.not.have.own.property('password');
      expect(proband1.compliance_labresults).to.equal(true);
      expect(proband1.study_accesses.length).to.equal(1);
      expect(proband1.study_accesses[0]?.study_id).to.equal('QTestStudy1');
      expect(proband1.study_accesses[0]?.access_level).to.equal('read');
      expect(result.body.links.self.href).to.equal('/users');
    });

    it('should return HTTP 200 with all Probands for ProbandenManager and pending compliance changes', async function () {
      const result: Response<{ users: ProbandResponseForPm[] }> = await chai
        .request(apiAddress)
        .get('/users')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.users.length).to.equal(3);
      const proband1 = result.body.users.find(
        (user) => user.username === 'QTestProband1'
      );
      assert(proband1);
      expect(proband1.username).to.equal('QTestProband1');
      expect(proband1.first_logged_in_at).to.not.equal(undefined);
      expect(proband1).to.not.have.own.property('password');
      expect(proband1.compliance_labresults).to.equal(true);
      expect(proband1.study_accesses.length).to.equal(1);
      expect(proband1.study_accesses[0]?.study_id).to.equal('QTestStudy1');
      expect(proband1.study_accesses[0]?.access_level).to.equal('read');
      const proband4 = result.body.users.find(
        (user) => user.username === 'QTestProband4'
      );
      assert(proband4);
      expect(proband4.username).to.equal('QTestProband4');
      expect(proband4.pendingComplianceChange).to.be.an('object');
      expect(proband4.pendingComplianceChange).to.contain({
        requested_by: 'pm1@example.com',
        requested_for: 'pm2@example.com',
        proband_id: 'QTestProband4',
      });
      expect(result.body.links.self.href).to.equal('/users');
    });

    it('should return HTTP 200 with all Non-Proband roles for SysAdmin', async function () {
      const result: Response<{ users: ProbandResponseForProfessionals[] }> =
        await chai.request(apiAddress).get('/users').set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.users.length).to.be.greaterThan(6);
      expect(result.body.users[0]?.username).not.to.be.undefined;
    });
  });

  describe('GET /usersWithSameRole', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });
    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/usersWithSameRole')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/usersWithSameRole')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and all forschers besides the requester himself', async function () {
      const result: Response<{ users: UserResponse[] }> = await chai
        .request(apiAddress)
        .get('/usersWithSameRole')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.users.length).to.equal(2);
      const researcher2 = result.body.users.find(
        (user) => user.username === 'researcher2@example.com'
      );
      const researcher3 = result.body.users.find(
        (user) => user.username === 'researcher3@example.com'
      );
      expect(researcher2).to.be.an('object');
      expect(researcher3).to.be.an('object');
      expect(researcher2).to.not.have.own.property('password');
      expect(researcher3).to.not.have.own.property('password');
      expect(result.body.links.self.href).to.equal('/users');
    });

    it('should return HTTP 200 and all uts besides the requester himself', async function () {
      const result: Response<{ users: UserResponse[] }> = await chai
        .request(apiAddress)
        .get('/usersWithSameRole')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.users.length).to.equal(1);
      const investigationteam2 = result.body.users.find(
        (user) => user.username === 'investigationteam2@example.com'
      );
      expect(investigationteam2).to.be.an('object');
      expect(investigationteam2).to.not.have.own.property('password');
      expect(result.body.links.self.href).to.equal('/users');
    });

    it('should return HTTP 200 and all pms besides the requester himself', async function () {
      const result: Response<{ users: UserResponse[] }> = await chai
        .request(apiAddress)
        .get('/usersWithSameRole')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.users.length).to.equal(2);
      const pm2 = result.body.users.find(
        (user) => user.username === 'pm2@example.com'
      );
      const pm3 = result.body.users.find(
        (user) => user.username === 'pm3@example.com'
      );
      expect(pm2).to.be.an('object');
      expect(pm3).to.be.an('object');
      expect(pm2).to.not.have.own.property('password');
      expect(pm3).to.not.have.own.property('password');
      expect(result.body.links.self.href).to.equal('/users');
    });

    it('should return HTTP 200 and all sysadmins besides the requester himself', async function () {
      const result: Response<{ users: UserResponse[] }> = await chai
        .request(apiAddress)
        .get('/usersWithSameRole')
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.users.length).to.be.greaterThan(1);
      const sysAdmin2 = result.body.users.find(
        (user) => user.username === 'QTestSystemAdmin2'
      );
      const sysAdmin3 = result.body.users.find(
        (user) => user.username === 'QTestSystemAdmin3'
      );
      expect(sysAdmin2).to.be.an('object');
      expect(sysAdmin3).to.be.an('object');
      expect(sysAdmin2).to.not.have.own.property('password');
      expect(sysAdmin3).to.not.have.own.property('password');
      expect(result.body.links.self.href).to.equal('/users');
    });

    it('should return HTTP 200 and empty users array is Forscher has no friends', async function () {
      const result: Response<{ users: UserResponse[] }> = await chai
        .request(apiAddress)
        .get('/usersWithSameRole')
        .set(forscherHeader4);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.users.length).to.equal(0);
      expect(result.body.links.self.href).to.equal('/users');
    });
  });

  describe('GET /users/{username}', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });
    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/users/QTestProband1')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a Proband tries to get someone else than himself', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/users/researcher1@example.com')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Proband tries to get a different proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/users/QTestProband2')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if the user does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/users/nonExistingUser')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with correct result when a Proband tries to get himself', async function () {
      const result: Response<ProbandResponseForProfessionals> = await chai
        .request(apiAddress)
        .get('/users/QTestProband1')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.username).to.equal('QTestProband1');
      expect(result.body.study_accesses.length).to.equal(1);
      expect(result.body.study_accesses[0]?.study_id).to.equal('QTestStudy1');
      expect(result.body.study_accesses[0]?.access_level).to.equal('read');
      expect(result.body.links.self.href).to.equal(
        '/users/' + result.body.username
      );
    });

    it('should return HTTP 200 with correct result when a Forscher tries to get himself', async function () {
      const result: Response<ProbandResponseForProfessionals> = await chai
        .request(apiAddress)
        .get('/users/researcher1@example.com')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.username).to.equal('researcher1@example.com');
      expect(result.body.study_accesses.length).to.equal(3);
      expect(result.body.links.self.href).to.equal(
        '/users/' + result.body.username
      );
    });

    it('should return HTTP 200 with correct result when a Forscher tries to get a Proband in his study', async function () {
      const result: Response<ProbandResponseForProfessionals> = await chai
        .request(apiAddress)
        .get('/users/QTestProband1')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.username).to.equal('QTestProband1');
      expect(result.body.study_accesses.length).to.equal(1);
      expect(result.body.compliance_labresults).to.equal(true);
      expect(result.body.study_accesses[0]?.study_id).to.equal('QTestStudy1');
      expect(result.body.study_accesses[0]?.access_level).to.equal('read');
      expect(result.body.links.self.href).to.equal(
        '/users/' + result.body.username
      );
    });

    it('should return HTTP 200 with correct result when a UT tries to get a Proband in his study', async function () {
      const result: Response<ProbandResponseForProfessionals> = await chai
        .request(apiAddress)
        .get('/users/QTestProband1')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.username).to.equal('QTestProband1');
      expect(result.body.study_accesses.length).to.equal(1);
      expect(result.body.compliance_labresults).to.equal(true);
      expect(result.body.study_accesses[0]?.study_id).to.equal('QTestStudy1');
      expect(result.body.study_accesses[0]?.access_level).to.equal('read');
      expect(result.body.links.self.href).to.equal(
        '/users/' + result.body.username
      );
    });

    it('should return HTTP 404 when a Forscher tries to get a Proband not in his study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/users/QTestProband1')
        .set(forscherHeader2);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });
  });

  describe('POST /users', function () {
    beforeEach(async function () {
      mockAuthserviceCreateUser();
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    const newUser = {
      username: 'QTestProbandNew1',
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
      username: 'forscherNew1@example.com',
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

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/users')
        .set(invalidHeader)
        .send(newUserForscher);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/users')
        .set(probandHeader1)
        .send(newUserForscher);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 409 when a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/users')
        .set(forscherHeader1)
        .send(newUserForscher);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 409 when a Untersuchungsteam tries to add a Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/users')
        .set(utHeader)
        .send(newUserForscher);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 400 when a Untersuchungsteam tries to add a Proband via this route', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/users')
        .set(utHeader)
        .send(newUser);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 409 when a SysSdmin tries to add a Forscher with invalid email', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/users')
        .set(sysadminHeader)
        .send(newUserForscherInvalidMail);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 200 without the created new password if the Sysadmin creates a new Forscher', async function () {
      const result: Response<UserWithStudyAccess> = await chai
        .request(apiAddress)
        .post('/users')
        .set(sysadminHeader)
        .send(newUserForscher);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.not.have.own.property('password');
      expect(result.body.study_accesses.length).to.equal(1);
      expect(result.body.study_accesses[0]?.study_id).to.equal('QTestStudy1');
      expect(result.body.study_accesses[0]?.access_level).to.equal('write');
    });

    it('should return HTTP 200 without the created new password if the Sysadmin creates a new Untersuchungsteam', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/users')
        .set(sysadminHeader)
        .send(newUserUntersuchungsTeam);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.not.have.own.property('password');
    });

    it('should return HTTP 200 without the created new password if the Sysadmin creates a new ProbandenManager', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/users')
        .set(sysadminHeader)
        .send(newUserProbandenManager);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.not.have.own.property('password');
    });

    it('should return HTTP 200 without the created new password if the Sysadmin creates a new EinwilligungsManager', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/users')
        .set(sysadminHeader)
        .send(newUserEinwilligungsManager);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.not.have.own.property('password');
    });

    it('should return HTTP 409 if the Sysadmin creates a new Probanden', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/users')
        .set(sysadminHeader)
        .send(newUser2);
      expect(result).to.have.status(400);
    });
  });

  describe('PUT /users/{username}', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    const markAsTestproband = {
      is_test_proband: true,
    };

    const markAsDeactivationPending = {
      account_status: 'deactivation_pending',
    };

    const markAsDeactivated = {
      account_status: 'deactivated',
    };

    const markAsActive = {
      account_status: 'active',
    };

    it('should return HTTP 200 when a Untersuchungsteam marks TestProband1 as Test Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(utHeader)
        .send(markAsTestproband);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.equal({ test_proband_state: true });
    });

    it('should return HTTP 200 when a PM marks active TestProband1 as deactivation_pending', async function () {
      const result: Response<{
        username: string;
        account_status: AccountStatus;
      }> = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(pmHeader)
        .send(markAsDeactivationPending);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.account_status).to.equal('deactivation_pending');

      const user = await db.one<{
        password: string;
        account_status: AccountStatus;
      }>('SELECT password, account_status FROM users WHERE username=$1', [
        probandSession1.username,
      ]);
      expect(user.password).to.not.equal('');
      expect(user.account_status).to.equal('deactivation_pending');
    });

    it('should return HTTP 200 when a PM marks deactivation_pending TestProband1 as deactivated', async function () {
      const result: Response<{
        username: string;
        account_status: AccountStatus;
      }> = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(pmHeader)
        .send(markAsDeactivationPending);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.account_status).to.equal('deactivation_pending');

      fetchMock.delete(
        'express:/personal/personalData/proband/:pseudonym',
        204
      );
      const deletePersonalDataOfUserSpy = testSandbox.spy(
        personaldataserviceClient,
        'deletePersonalDataOfUser'
      );
      const result2: Response<{
        username: string;
        account_status: AccountStatus;
      }> = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(pmHeader)
        .send(markAsDeactivated);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body.account_status).to.equal('deactivated');
      expect(deletePersonalDataOfUserSpy.calledOnce).to.be.true;

      const user = await db.one<{
        password: string;
        account_status: AccountStatus;
      }>('SELECT password, account_status FROM users WHERE username=$1', [
        probandSession1.username,
      ]);
      expect(user.password).to.equal('');
      expect(user.account_status).to.equal('deactivated');
    });

    it('should return HTTP 200 when a PM marks deactivation_pending TestProband1 as active', async function () {
      const result: Response<{
        username: string;
        account_status: AccountStatus;
      }> = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(pmHeader)
        .send(markAsDeactivationPending);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.account_status).to.equal('deactivation_pending');
      const result2: Response<{
        username: string;
        account_status: AccountStatus;
      }> = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(pmHeader)
        .send(markAsActive);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body.account_status).to.equal('active');

      const user = await db.one<{
        password: string;
        account_status: AccountStatus;
      }>('SELECT password, account_status FROM users WHERE username=$1', [
        probandSession1.username,
      ]);
      expect(user.password).to.not.equal('');
      expect(user.account_status).to.equal('active');
    });

    it('should return HTTP 500 when a PM marks active TestProband1 as deactivated', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(pmHeader)
        .send(markAsDeactivated);
      expect(result).to.have.status(500);
    });

    it('should return HTTP 500 when a PM marks deactivated TestProband1 as active', async function () {
      fetchMock.delete(
        'express:/personal/personalData/proband/:pseudonym',
        204
      );
      const result: Response<{
        username: string;
        account_status: AccountStatus;
      }> = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(pmHeader)
        .send(markAsDeactivationPending);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.account_status).to.equal('deactivation_pending');
      const result2: Response<{
        username: string;
        account_status: AccountStatus;
      }> = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(pmHeader)
        .send(markAsDeactivated);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body.account_status).to.equal('deactivated');
      const result3 = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(pmHeader)
        .send(markAsActive);
      expect(result3).to.have.status(500);
    });

    it('should return HTTP 403 when a Proband marks TestProband1 as Test Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(probandHeader1)
        .send(markAsTestproband);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a System Admin marks TestProband1 as Test Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(sysadminHeader)
        .send(markAsTestproband);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 500 when a ut marks deleted proband as testprband', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/users/QTestProband2')
        .set(utHeader)
        .send(markAsTestproband);
      expect(result).to.have.status(500);
    });

    it('should return HTTP 500 when a ut marks deactivated proband as testprband', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/users/QTestProband3')
        .set(utHeader)
        .send(markAsTestproband);
      expect(result).to.have.status(500);
    });

    it('should return HTTP 422 when a Proband Manager marks TestProband1 as Test Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(pmHeader)
        .send(markAsTestproband);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 403 when a researcher marks TestProband1 as Test Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/users/' + probandSession1.username)
        .set(forscherHeader1)
        .send(markAsTestproband);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });
  });

  describe('DELETE /users/{username}', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });
    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/users/researcher1@example.com')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/users/researcher1@example.com')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/users/researcher1@example.com')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/users/researcher1@example.com')
        .set(utHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if the user does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/users/nonExistingUser')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 403 if a ProbandenManager tries to delete a Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/users/researcher1@example.com')
        .set(pmHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when Sysadmin tries deleting a Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/users/QTestProband1')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 and delete the user of role Forscher and all its data', async function () {
      const result: Response<{ username: string }> = await chai
        .request(apiAddress)
        .delete('/users/researcher1@example.com')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.username).to.equal('researcher1@example.com');
    });

    it('should return HTTP 200 and delete the user of role ProbandenManager and all its data', async function () {
      const result: Response<{ username: string }> = await chai
        .request(apiAddress)
        .delete('/users/pm3@example.com')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.username).to.equal('pm3@example.com');
      const user = await db.oneOrNone<{ username: string }>(
        "SELECT username FROM users WHERE username = 'pm3@example.com'"
      );
      expect(user).to.be.null;
    });

    it('should return HTTP 200 and delete the user of role Untersuchungsteam and all its data', async function () {
      const result: Response<{ username: string }> = await chai
        .request(apiAddress)
        .delete('/users/investigationteam1@example.com')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.username).to.equal('investigationteam1@example.com');

      const user = await db.oneOrNone<{ username: string }>(
        "SELECT username FROM users WHERE username = 'investigationteam1@example.com'"
      );
      expect(user).to.be.null;
    });
  });
});
