/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import * as sinon from 'sinon';
import fetchMocker from 'fetch-mock';

import * as JWT from 'jsonwebtoken';
import secretOrPrivateKey from '../secretOrPrivateKey';
import {
  HttpClient,
  SystemLogInternalDto,
} from '@pia-system/lib-http-clients-internal';

import { db } from '../../src/db';

import { Server } from '../../src/server';
import { StatusCodes } from 'http-status-codes';

import {
  cleanup,
  setupDelete,
  setupGet,
  setupPost,
  setupPut,
} from './pendingComplianceChanges.spec.data/setup.helper';
import { PendingComplianceChange } from '../../src/models/pendingComplianceChange';

interface ProbandCompliance {
  username: string;
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
}

chai.use(chaiHttp);

const apiAddress = `http://localhost:${process.env['PORT'] ?? '80'}/user`;

const fetchMock = fetchMocker.sandbox();
const serverSandbox = sinon.createSandbox();
const testSandbox = sinon.createSandbox();

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'ApiTestProband1',
  groups: ['ApiTestStudie1'],
};
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'forscher1@apitest.de',
  groups: ['ApiTestStudie1'],
};
const utSession1 = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'ut1@apitest.de',
  groups: ['ApiTestStudie1'],
};
const sysadminSession1 = {
  id: 1,
  role: 'SysAdmin',
  username: 'sa1@apitest.de',
};
const pmSession1 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm1@apitest.de',
  groups: ['ApiTestStudie1'],
};
const pmSession2 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm2@apitest.de',
  groups: ['ApiTestStudie1'],
};
const pmSession3 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pmNoEmail',
  groups: ['ApiTestStudie1'],
};
const pmSession4 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm4@apitest.de',
  groups: ['ApiTestStudie4'],
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
const utToken1 = JWT.sign(utSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken1 = JWT.sign(sysadminSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken1 = JWT.sign(pmSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken2 = JWT.sign(pmSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken3 = JWT.sign(pmSession3, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken4 = JWT.sign(pmSession4, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const forscherHeader1 = { authorization: forscherToken1 };
const utHeader1 = { authorization: utToken1 };
const sysadminHeader1 = { authorization: sysadminToken1 };
const pmHeader1 = { authorization: pmToken1 };
const pmHeader2 = { authorization: pmToken2 };
const pmHeader3 = { authorization: pmToken3 };
const pmHeader4 = { authorization: pmToken4 };

describe('/pendingComplianceChanges', function () {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    serverSandbox.restore();
  });

  beforeEach(() => {
    testSandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
    fetchMock.post('express:/log/systemLogs', (_url, opts) => {
      const request = JSON.parse(opts.body as string) as SystemLogInternalDto;

      const body = { ...request };
      body.timestamp = new Date().toString();

      return {
        body,
      };
    });
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET pendingcompliancechanges/id', function () {
    beforeEach(async () => {
      await setupGet();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(pmHeader3);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when the pending compliance change id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/999999')
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_by', async function () {
      const id = 1234560;
      const result = await chai
        .request(apiAddress)
        .get(`/pendingcompliancechanges/${id}`)
        .set(pmHeader1);
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.id).to.equal(id);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('ApiTestProband1');
      expect(response.compliance_labresults_from).to.equal(false);
      expect(response.compliance_labresults_to).to.equal(true);
      expect(response.compliance_samples_from).to.equal(false);
      expect(response.compliance_samples_to).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_for', async function () {
      const id = 1234560;
      const result = await chai
        .request(apiAddress)
        .get(`/pendingcompliancechanges/${id}`)
        .set(pmHeader2);
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.id).to.equal(id);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('ApiTestProband1');
      expect(response.compliance_labresults_from).to.equal(false);
      expect(response.compliance_labresults_to).to.equal(true);
      expect(response.compliance_samples_from).to.equal(false);
      expect(response.compliance_samples_to).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_by without email address', async function () {
      const id = 1234561;
      const result = await chai
        .request(apiAddress)
        .get(`/pendingcompliancechanges/${id}`)
        .set(pmHeader3);
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.id).to.equal(id);
      expect(response.requested_by).to.equal('pmNoEmail');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('ApiTestProband1');
      expect(response.compliance_labresults_from).to.equal(false);
      expect(response.compliance_labresults_to).to.equal(true);
      expect(response.compliance_samples_from).to.equal(false);
      expect(response.compliance_samples_to).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);
    });
  });

  describe('POST pendingcompliancechanges', function () {
    beforeEach(async () => {
      await setupPost();
    });

    afterEach(async () => {
      await cleanup();
    });

    const pDValid1 = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'ApiTestProband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDValid2 = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'ApiTestProband1',
      compliance_labresults_to: false,
    };

    const pDwrongFor = {
      requested_for: 'nonexisting@pm.de',
      proband_id: 'ApiTestProband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDwrongProband = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'NonexistingProband',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDNoEmailFor = {
      requested_for: 'pmNoEmail',
      proband_id: 'ApiTestProband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDWrongStudyPM = {
      requested_for: 'pm4@apitest.de',
      proband_id: 'ApiTestProband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDWrongStudyProband = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'ApiTestProband2',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDConflictProband = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'ApiTestProband3',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(invalidHeader)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(probandHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(forscherHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(utHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(sysadminHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 422 when a pm tries for himself', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader2)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 422 when a pm from wrong study tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader4)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 422 when requested_for is no email address and not create pending compliance change object', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDNoEmailFor);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
      await db
        .oneOrNone(
          'SELECT * FROM pending_compliance_changes WHERE proband_id=$1',
          ['ApiTestProband1']
        )
        .then((cc) => {
          expect(cc).to.equal(null);
        });
    });

    it('should return HTTP 422 when requested_for is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDWrongStudyPM);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 422 when target proband is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDWrongStudyProband);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 422 when target proband is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDwrongProband);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 422 when target pm is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDwrongFor);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 403 when targeted proband has a change request already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDConflictProband);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and create pending compliance change', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDValid1);
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('ApiTestProband1');

      expect(response.compliance_labresults_to).to.equal(true);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);
    });

    it('should return HTTP 200 and create pending compliance change if no_email_pm requests', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader3)
        .send(pDValid1);
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pmNoEmail');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('ApiTestProband1');

      expect(response.compliance_labresults_to).to.equal(true);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);
    });

    it('should return HTTP 200 and create pending compliance change with a view missing params', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDValid2);
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('ApiTestProband1');

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(true);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);
    });
  });

  describe('PUT pendingcompliancechanges/id', function () {
    beforeEach(async () => {
      await setupPut();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when requested_by pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 wrong pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(pmHeader3)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and change probands compliances, delete compliance needes fb instances and post deletion log', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(pmHeader2)
        .send({});
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);

      const proband: ProbandCompliance = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['ApiTestProband1']
      );
      const instances = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE user_id=$1',
        ['ApiTestProband1']
      );
      expect(fetchMock.called()).to.be.true;

      const expectedInstanceCount = 3;
      expect(instances.length).to.equal(expectedInstanceCount);
      expect(proband.compliance_labresults).to.equal(false);
      expect(proband.compliance_samples).to.equal(false);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });

    it('should return HTTP 200 and change probands compliances, not delete compliance needes fb instances and post deletion log', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234561')
        .set(pmHeader2)
        .send({});
      const response = result.body as PendingComplianceChange;

      expect(result).to.have.status(StatusCodes.OK);

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(true);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);

      const proband: ProbandCompliance = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['ApiTestProband1']
      );
      const instances = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE user_id=$1',
        ['ApiTestProband1']
      );
      expect(fetchMock.called()).to.be.true;

      const expectedInstanceCount = 5;
      expect(instances.length).to.equal(expectedInstanceCount);
      expect(proband.compliance_labresults).to.equal(false);
      expect(proband.compliance_samples).to.equal(true);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });
  });

  describe('DELETE pendingcompliancechanges/id', function () {
    beforeEach(async () => {
      await setupDelete();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 pm of another study tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(pmHeader4)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and cancel changing of proband compliances for requested_by pm', async function () {
      const id = 1234560;
      const result = await chai
        .request(apiAddress)
        .delete(`/pendingcompliancechanges/${id}`)
        .set(pmHeader1)
        .send({});
      const response = result.body as PendingComplianceChange;

      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('ApiTestProband1');

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);

      const proband: ProbandCompliance = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['ApiTestProband1']
      );
      const hasPendingComplianceChange =
        (await db.oneOrNone(
          'SELECT * FROM pending_compliance_changes WHERE id=$1',
          [id]
        )) !== null;

      expect(hasPendingComplianceChange).to.be.false;
      expect(proband.compliance_labresults).to.equal(true);
      expect(proband.compliance_samples).to.equal(true);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });

    it('should return HTTP 200 and cancel changing of proband compliances for requested_for pm', async function () {
      const id = 1234560;
      const result = await chai
        .request(apiAddress)
        .delete(`/pendingcompliancechanges/${id}`)
        .set(pmHeader2)
        .send({});
      const response = result.body as PendingComplianceChange;

      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('ApiTestProband1');

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);

      const proband: ProbandCompliance = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['ApiTestProband1']
      );
      const hasPendingComplianceChange =
        (await db.oneOrNone(
          'SELECT * FROM pending_compliance_changes WHERE id=$1',
          [id]
        )) !== null;

      expect(hasPendingComplianceChange).to.be.false;
      expect(proband.compliance_labresults).to.equal(true);
      expect(proband.compliance_samples).to.equal(true);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });

    it('should return HTTP 200 and cancel changing of proband compliances for another pm of the same study', async function () {
      const id = 1234560;
      const result = await chai
        .request(apiAddress)
        .delete(`/pendingcompliancechanges/${id}`)
        .set(pmHeader3)
        .send({});
      const response = result.body as PendingComplianceChange;

      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('ApiTestProband1');

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);

      const proband: ProbandCompliance = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['ApiTestProband1']
      );
      const hasPendingComplianceChange =
        (await db.oneOrNone(
          'SELECT * FROM pending_compliance_changes WHERE id=$1',
          [id]
        )) !== null;

      expect(hasPendingComplianceChange).to.be.false;
      expect(proband.compliance_labresults).to.equal(true);
      expect(proband.compliance_samples).to.equal(true);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });
  });
});
