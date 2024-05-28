/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-magic-numbers,@typescript-eslint/no-unsafe-call */
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';

import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { Server } from '../../../src/server';
import { config } from '../../../src/config';
import { cleanup, setup } from './plannedProbands.spec.data/setup.helper';
import { StatusCodes } from 'http-status-codes';
import { PlannedProbandDeprecated } from '../../../src/models/plannedProband';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['ApiTestStudie'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['ApiTestStudie', 'ApiTestStudie2', 'ApiTestMultiProf'],
});
const utHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'ut@apitest.de',
  studies: ['ApiTestStudie', 'ApiTestMultiProf'],
});
const utHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'ut2@apitest.de',
  studies: ['ApiTestStudie2'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin',
  studies: [],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['ApiTestStudie', 'ApiTestMultiProf'],
});

describe('/admin/plannedprobands', function () {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  beforeEach(() => AuthServerMock.adminRealm().returnValid());
  afterEach(AuthServerMock.cleanAll);

  describe('GET /admin/plannedprobands', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands')
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with empty array if user has no planned probands in study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands')
        .set(utHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.plannedprobands.length).to.equal(0);
    });

    it('should return HTTP 200 with planned probands from correct study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.plannedprobands.length).to.equal(2);
      expect(result.body.plannedprobands[0].user_id).to.equal('planned1');
      expect(result.body.plannedprobands[0].password).to.equal('aPassword1');
      expect(result.body.plannedprobands[0].activated_at).to.not.equal(null);
      expect(result.body.plannedprobands[0].study_accesses.length).to.equal(2);
      expect(result.body.plannedprobands[1].user_id).to.equal('planned2');
      expect(result.body.plannedprobands[1].password).to.equal('aPassword2');
      expect(result.body.plannedprobands[1].activated_at).to.equal(null);
      expect(result.body.plannedprobands[1].study_accesses.length).to.equal(1);
    });
  });

  describe('GET /admin/plannedprobands/{pseudonym}', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands/planned1')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands/planned1')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands/planned1')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands/planned1')
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if a ut tries who is not in correct study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands/planned1')
        .set(utHeader2);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a ut tries for planned proband without a study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands/planned3')
        .set(utHeader2);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a ut tries for non existing planned proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands/plannedwrong')
        .set(utHeader2);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with correct planned proband object', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands/planned1')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.user_id).to.equal('planned1');
      expect(result.body.password).to.equal('aPassword1');
      expect(result.body.activated_at).to.not.equal(null);
      expect(result.body.study_accesses.length).to.equal(2);
    });

    it('should also accept pseudonyms in uppercase', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands/PLANNED1')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.user_id).to.equal('planned1');
    });
  });

  describe('DELETE /admin/plannedprobands/{pseudonym}', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/plannedprobands/planned1')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/plannedprobands/planned1')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/plannedprobands/planned1')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/plannedprobands/planned1')
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if a ut tries who is not in correct study', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/plannedprobands/planned1')
        .set(utHeader2);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a ut tries for planned proband without a study', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/plannedprobands/planned3')
        .set(utHeader2);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a ut tries for non existing planned proband', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/plannedprobands/plannedwrong')
        .set(utHeader2);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with correct planned proband object and delete the proband', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/plannedprobands/planned1')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.user_id).to.equal('planned1');
      expect(result.body.password).to.equal('aPassword1');
      expect(result.body.activated_at).to.not.equal(null);

      AuthServerMock.adminRealm().returnValid();
      const result2 = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands/planned1')
        .set(utHeader1);
      expect(result2).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should also accept pseudonyms in uppercase', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/plannedprobands/PLANNED1')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.user_id).to.equal('planned1');
    });
  });

  describe('POST /admin/plannedprobands', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    const pseudonyms = [
      'planned1',
      'planned2',
      'planned3',
      'planned4',
      'planned5',
    ];

    const duplicates = ['planned4', 'planned4', 'planned4'];

    const duplicates2 = ['planned4', 'qtest-proband1'];

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/plannedprobands')
        .set(probandHeader1)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/plannedprobands')
        .set(pmHeader)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/plannedprobands')
        .set(forscherHeader1)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/plannedprobands')
        .set(sysadminHeader)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 400 if an empty array is sent', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/plannedprobands')
        .set(utHeader1)
        .send({ pseudonyms: [] });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 200 and add only one of duplicate pseudonyms', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/plannedprobands')
        .set(utHeader1)
        .send({ pseudonyms: duplicates });
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.plannedprobands.length).to.equal(3);
      expect(result.body.plannedprobands[0].wasCreated).to.equal(true);
      expect(result.body.plannedprobands[1].wasCreated).to.equal(false);
      expect(result.body.plannedprobands[2].wasCreated).to.equal(false);

      AuthServerMock.adminRealm().returnValid();
      const result2 = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands')
        .set(utHeader1);
      expect(result2.body.plannedprobands.length).to.equal(3);
    });

    it('should return HTTP 200 and add only one of pseudonyms because the other one is associated with an existing proband', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/plannedprobands')
        .set(utHeader1)
        .send({ pseudonyms: duplicates2 });
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.plannedprobands.length).to.equal(2);
      expect(result.body.plannedprobands[0].wasCreated).to.equal(true);
      expect(result.body.plannedprobands[1].wasCreated).to.equal(false);

      AuthServerMock.adminRealm().returnValid();
      const result2 = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands')
        .set(utHeader1);
      expect(result2.body.plannedprobands.length).to.equal(3);
    });

    it('should also accept pseudonyms in uppercase', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/plannedprobands')
        .set(utHeader1)
        .send({ pseudonyms: ['PLANNED4'] });
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.plannedprobands.length).to.equal(1);
      expect(result.body.plannedprobands[0].wasCreated).to.equal(true);
    });

    it('should return HTTP 200 and add only pseudonyms that were not present before', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/plannedprobands')
        .set(utHeader1)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.plannedprobands.length).to.equal(5);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const plannedProbandsSorted = result.body.plannedprobands.sort(
        (a: PlannedProbandDeprecated, b: PlannedProbandDeprecated) =>
          a.user_id > b.user_id ? 1 : a.user_id < b.user_id ? -1 : 0
      );
      expect(plannedProbandsSorted[0].wasCreated).to.equal(false);
      expect(plannedProbandsSorted[0].user_id).to.equal('planned1');
      expect(plannedProbandsSorted[0].study_accesses.length).to.equal(0);
      expect(plannedProbandsSorted[1].wasCreated).to.equal(false);
      expect(plannedProbandsSorted[1].user_id).to.equal('planned2');
      expect(plannedProbandsSorted[1].study_accesses.length).to.equal(0);
      expect(plannedProbandsSorted[2].wasCreated).to.equal(false);
      expect(plannedProbandsSorted[2].user_id).to.equal('planned3');
      expect(plannedProbandsSorted[2].study_accesses.length).to.equal(0);
      expect(plannedProbandsSorted[3].wasCreated).to.equal(true);
      expect(plannedProbandsSorted[3].user_id).to.equal('planned4');
      expect(plannedProbandsSorted[3].study_accesses.length).to.equal(2);
      expect(
        plannedProbandsSorted[3].study_accesses.some(
          (sa: { study_id: string }) => sa.study_id === 'ApiTestMultiProf'
        )
      ).to.be.true;
      expect(
        plannedProbandsSorted[3].study_accesses.some(
          (sa: { study_id: string }) => sa.study_id === 'ApiTestStudie'
        )
      ).to.be.true;
      expect(plannedProbandsSorted[4].wasCreated).to.equal(true);
      expect(plannedProbandsSorted[4].user_id).to.equal('planned5');
      expect(plannedProbandsSorted[4].study_accesses.length).to.equal(2);
      expect(
        plannedProbandsSorted[4].study_accesses.some(
          (sa: { study_id: string }) => sa.study_id === 'ApiTestMultiProf'
        )
      ).to.be.true;
      expect(
        plannedProbandsSorted[4].study_accesses.some(
          (sa: { study_id: string }) => sa.study_id === 'ApiTestStudie'
        )
      ).to.be.true;

      AuthServerMock.adminRealm().returnValid();
      const result2 = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands')
        .set(utHeader1);
      expect(result2.body.plannedprobands.length).to.equal(4);
    });

    it('should return HTTP 200 and only assign the studies of the requesting ut', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/plannedprobands')
        .set(utHeader2)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(StatusCodes.OK);

      expect(result.body.plannedprobands.length).to.equal(5);
      expect(result.body.plannedprobands[0].wasCreated).to.equal(false);
      expect(result.body.plannedprobands[0].user_id).to.equal('planned1');
      expect(result.body.plannedprobands[0].study_accesses.length).to.equal(0);
      expect(result.body.plannedprobands[1].wasCreated).to.equal(false);
      expect(result.body.plannedprobands[1].user_id).to.equal('planned2');
      expect(result.body.plannedprobands[1].study_accesses.length).to.equal(0);
      expect(result.body.plannedprobands[2].wasCreated).to.equal(false);
      expect(result.body.plannedprobands[2].user_id).to.equal('planned3');
      expect(result.body.plannedprobands[2].study_accesses.length).to.equal(0);
      expect(result.body.plannedprobands[3].wasCreated).to.equal(true);
      expect(result.body.plannedprobands[3].user_id).to.equal('planned4');
      expect(result.body.plannedprobands[3].study_accesses.length).to.equal(1);
      expect(
        result.body.plannedprobands[3].study_accesses[0].study_id
      ).to.equal('ApiTestStudie2');
      expect(result.body.plannedprobands[4].wasCreated).to.equal(true);
      expect(result.body.plannedprobands[4].user_id).to.equal('planned5');
      expect(result.body.plannedprobands[4].study_accesses.length).to.equal(1);
      expect(
        result.body.plannedprobands[4].study_accesses[0].study_id
      ).to.equal('ApiTestStudie2');

      AuthServerMock.adminRealm().returnValid();
      const result2 = await chai
        .request(apiAddress)
        .get('/admin/plannedprobands')
        .set(utHeader1);
      expect(result2.body.plannedprobands.length).to.equal(2);
    });
  });
});
