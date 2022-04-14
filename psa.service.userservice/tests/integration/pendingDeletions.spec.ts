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
import { HttpClient } from '@pia-system/lib-http-clients-internal';

import { db } from '../../src/db';

import { Server } from '../../src/server';
import { StatusCodes } from 'http-status-codes';

import { cleanup, setup } from './pendingDeletions.spec.data/setup.helper';
import { DbStudy } from '../../src/models/study';
import { MailService } from '@pia/lib-service-core';
import { Response } from './instance.helper.spec';
import {
  PendingProbandDeletionDto,
  PendingSampleDeletionDto,
  PendingStudyDeletionDto,
} from '../../src/models/pendingDeletion';

interface LabResult {
  id: string;
  order_id: number | null;
  status: string | null;
  remark: string | null;
  new_samples_sent: boolean | null;
  performing_doctor: string | null;
  dummy_sample_id: string | null;
  study_status: string;
}

interface Proband {
  password: string;
  status: string;
  study_status: string;
  first_logged_in_at: Date | null;
  logged_in_with: string;
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
  compliance_contact: boolean;
  needs_material: boolean;
  pw_change_needed: boolean;
  number_of_wrong_attempts: number;
  third_wrong_password_at: Date | null;
  study_center: string;
  examination_wave: number;
}

chai.use(chaiHttp);

const apiAddress = `http://localhost:${process.env['PORT'] ?? '80'}/user`;

const fetchMock = fetchMocker.sandbox();
const suiteSandbox = sinon.createSandbox();
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
  groups: ['ApiTestStudie1'],
};
const sysadminSession2 = {
  id: 1,
  role: 'SysAdmin',
  username: 'sa2@apitest.de',
};
const sysadminSession3 = {
  id: 1,
  role: 'SysAdmin',
  username: 'sa3@apitest.de',
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
  groups: ['ApiTestStudie2', 'ApiTestStudie3'],
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
const sysadminToken2 = JWT.sign(sysadminSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken3 = JWT.sign(sysadminSession3, secretOrPrivateKey, {
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
const sysadminHeader2 = { authorization: sysadminToken2 };
const sysadminHeader3 = { authorization: sysadminToken3 };
const pmHeader1 = { authorization: pmToken1 };
const pmHeader2 = { authorization: pmToken2 };
const pmHeader3 = { authorization: pmToken3 };
const pmHeader4 = { authorization: pmToken4 };

describe('/pendingDeletions', function () {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(() => {
    testSandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
    fetchMock
      .catch(StatusCodes.SERVICE_UNAVAILABLE)
      .post('express:/log/systemLogs', {}, { name: 'createSystemLog' })
      .delete(
        'express:/personal/personalData/proband/:pseudonym',
        StatusCodes.NO_CONTENT,
        {
          name: 'deletePersonalDataOfUser',
        }
      );
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /user/studies/{studyName}/pendingdeletions', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const studyName = 'ApiTestStudie1';
      const result = await chai
        .request(apiAddress)
        .get(`/studies/${studyName}/pendingdeletions`)
        .query({
          type: 'proband',
        })
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const studyName = 'ApiTestStudie1';
      const result = await chai
        .request(apiAddress)
        .get(`/studies/${studyName}/pendingdeletions`)
        .query({
          type: 'proband',
        })
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const studyName = 'ApiTestStudie1';
      const result = await chai
        .request(apiAddress)
        .get(`/studies/${studyName}/pendingdeletions`)
        .query({
          type: 'proband',
        })
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const studyName = 'ApiTestStudie1';
      const result = await chai
        .request(apiAddress)
        .get(`/studies/${studyName}/pendingdeletions`)
        .query({
          type: 'proband',
        })
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries for proband pending deletion', async function () {
      const studyName = 'ApiTestStudie1';
      const result = await chai
        .request(apiAddress)
        .get(`/studies/${studyName}/pendingdeletions`)
        .query({
          type: 'proband',
        })
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 500 when a sysadmin tries for study pending deletion - as long as not implemented', async function () {
      const studyName = 'ApiTestStudie1';
      const result = await chai
        .request(apiAddress)
        .get(`/studies/${studyName}/pendingdeletions`)
        .query({
          type: 'study',
        })
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return HTTP 500 when a pm tries for sample pending deletion - as long as not implemented', async function () {
      const studyName = 'ApiTestStudie1';
      const result = await chai
        .request(apiAddress)
        .get(`/studies/${studyName}/pendingdeletions`)
        .query({
          type: 'sample',
        })
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return HTTP 200 when a pm tries that is not involved in the deletion', async function () {
      const studyName = 'ApiTestStudie1';
      const expectedResultsCount = 2;
      const result = await chai
        .request(apiAddress)
        .get(`/studies/${studyName}/pendingdeletions`)
        .query({
          type: 'proband',
        })
        .set(pmHeader3);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body)
        .to.be.an('array')
        .and.to.have.length(expectedResultsCount);
    });

    it('should return HTTP 403 with the pending deletion for pm who is requested_for', async function () {
      const studyName = 'ApiTestStudie2';
      const result: Response<PendingProbandDeletionDto> = await chai
        .request(apiAddress)
        .get(`/studies/${studyName}/pendingdeletions`)
        .query({
          type: 'proband',
        })
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });
  });

  describe('GET pendingdeletions/id', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries for proband pending deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries for sample pending deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234562')
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries for study pending deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234565')
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(pmHeader3);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when the pending deletion id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/999999')
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by', async function () {
      const id = 1234560;
      const result: Response<PendingProbandDeletionDto> = await chai
        .request(apiAddress)
        .get(`/pendingdeletions/${id}`)
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(id);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband2');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_for', async function () {
      const id = 1234560;
      const result: Response<PendingProbandDeletionDto> = await chai
        .request(apiAddress)
        .get(`/pendingdeletions/${id}`)
        .set(pmHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(id);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband2');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by without email address', async function () {
      const id = 1234561;
      const result: Response<PendingProbandDeletionDto> = await chai
        .request(apiAddress)
        .get(`/pendingdeletions/${id}`)
        .set(pmHeader3);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(id);
      expect(result.body.requested_by).to.equal('pmNoEmail');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband1');
    });

    it('should return HTTP 200 with the pending deletion for a sample id', async function () {
      const id = 1234562;
      const result: Response<PendingSampleDeletionDto> = await chai
        .request(apiAddress)
        .get(`/pendingdeletions/${id}`)
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(id);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('sample');
      expect(result.body.for_id).to.equal('APISAMPLE_11111');
    });

    it('should return HTTP 200 with the pending deletion for a study id', async function () {
      const id = 1234565;
      const result: Response<PendingStudyDeletionDto> = await chai
        .request(apiAddress)
        .get(`/pendingdeletions/${id}`)
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(id);
      expect(result.body.requested_by).to.equal('sa1@apitest.de');
      expect(result.body.requested_for).to.equal('sa2@apitest.de');
      expect(result.body.type).to.equal('study');
      expect(result.body.for_id).to.equal('ApiTestStudie1');
    });
  });

  describe('GET pendingdeletions/proband/proband_id', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband1')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband1')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband1')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband1')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband1')
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband2')
        .set(pmHeader3);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when the pending deletion user id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/nonexistingProband')
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by', async function () {
      const id = 1234560;
      const result: Response<PendingProbandDeletionDto> = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband2')
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(id);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband2');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_for', async function () {
      const id = 1234560;
      const result: Response<PendingProbandDeletionDto> = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband2')
        .set(pmHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(id);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband2');
    });
  });

  describe('GET pendingdeletions/sample/sample_id', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(pmHeader3);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when the pending deletion sample id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/nonexistingProband')
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 when the pending deletion os not of type sample', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/ApiTestProband1')
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by', async function () {
      const id = 1234562;
      const result: Response<PendingSampleDeletionDto> = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(id);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('sample');
      expect(result.body.for_id).to.equal('APISAMPLE_11111');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_for', async function () {
      const id = 1234562;
      const result: Response<PendingSampleDeletionDto> = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(pmHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(id);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('sample');
      expect(result.body.for_id).to.equal('APISAMPLE_11111');
    });
  });

  describe('GET pendingdeletions/study/study_id', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a om tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(sysadminHeader3);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when the pending deletion study id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiNonExistingStudy')
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the pending deletion for sysadmin who is requested_by', async function () {
      const id = 1234565;
      const result: Response<PendingStudyDeletionDto> = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(id);
      expect(result.body.requested_by).to.equal('sa1@apitest.de');
      expect(result.body.requested_for).to.equal('sa2@apitest.de');
      expect(result.body.type).to.equal('study');
      expect(result.body.for_id).to.equal('ApiTestStudie1');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_for', async function () {
      const id = 1234565;
      const result: Response<PendingStudyDeletionDto> = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(sysadminHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(id);
      expect(result.body.requested_by).to.equal('sa1@apitest.de');
      expect(result.body.requested_for).to.equal('sa2@apitest.de');
      expect(result.body.type).to.equal('study');
      expect(result.body.for_id).to.equal('ApiTestStudie1');
    });
  });

  describe('POST pendingdeletions', function () {
    beforeEach(async function () {
      await setup();
      testSandbox.stub(MailService, 'sendMail').resolves(true);
    });

    afterEach(async function () {
      await cleanup();
    });

    const pDValid1 = {
      requested_for: 'pm2@apitest.de',
      type: 'proband',
      for_id: 'ApiTestProband4',
    };

    const pDValid2 = {
      requested_for: 'pm2@apitest.de',
      type: 'sample',
      for_id: 'APISAMPLE_11113',
    };

    const pDValid3 = {
      requested_for: 'sa2@apitest.de',
      type: 'study',
      for_id: 'ApiTestStudie2',
    };

    const pDwrongFor = {
      requested_for: 'nonexisting@pm.de',
      type: 'proband',
      for_id: 'ApiTestProband1',
    };

    const pDwrongType = {
      requested_for: 'pm2@apitest.de',
      type: 'wrongtype',
      for_id: 'ApiTestProband1',
    };

    const pDwrongTypeForRole1 = {
      requested_for: 'pm2@apitest.de',
      type: 'study',
      for_id: 'ApiTestStudie1',
    };

    const pDwrongTypeForRole2 = {
      requested_for: 'sa2@apitest.de',
      type: 'proband',
      for_id: 'ApiTestProband1',
    };

    const pDwrongTypeForRole3 = {
      requested_for: 'sa2@apitest.de',
      type: 'sample',
      for_id: 'APISAMPLE_11111',
    };

    const pDwrongProband = {
      requested_for: 'pm2@apitest.de',
      type: 'proband',
      for_id: 'NonexistingProband',
    };

    const pDwrongSample = {
      requested_for: 'pm2@apitest.de',
      type: 'sample',
      for_id: 'nonexistingSample',
    };

    const pDNoEmailProband = {
      requested_for: 'pmNoEmail',
      type: 'proband',
      for_id: 'ApiTestProband1',
    };

    const pDNoEmailSample = {
      requested_for: 'pmNoEmail',
      type: 'sample',
      for_id: 'APISAMPLE_11111',
    };

    const pDWrongStudyPM = {
      requested_for: 'pm4@apitest.de',
      type: 'proband',
      for_id: 'ApiTestProband1',
    };

    const pDWrongStudyProband = {
      requested_for: 'pm2@apitest.de',
      type: 'proband',
      for_id: 'ApiTestProband2',
    };

    const pDWrongStudySample = {
      requested_for: 'pm2@apitest.de',
      type: 'sample',
      for_id: 'APISAMPLE_11112',
    };

    const pDConflictProband = {
      requested_for: 'pm2@apitest.de',
      type: 'proband',
      for_id: 'ApiTestProband1',
    };

    const pDConflictSample = {
      requested_for: 'pm2@apitest.de',
      type: 'sample',
      for_id: 'APISAMPLE_11111',
    };

    const pDConflictStudy = {
      requested_for: 'sa2@apitest.de',
      type: 'study',
      for_id: 'ApiTestStudie1',
    };

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(invalidHeader)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(probandHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(forscherHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(utHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries for proband deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(sysadminHeader1)
        .send(pDwrongTypeForRole2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries for sample deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(sysadminHeader1)
        .send(pDwrongTypeForRole3);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries for study deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDwrongTypeForRole1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 422 when a pm tries for himself', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader2)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 422 when proband cannot be found in any study of the pm', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader4)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 400 when requested_for is no email address and not change proband status', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDNoEmailProband);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
      const proband: Proband = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['ApiTestProband1']
      );
      const account = (await db.one(
        'SELECT * FROM accounts WHERE username=$1',
        ['ApiTestProband1']
      )) as unknown;
      expect(proband.status).to.equal('active');
      expect(account).to.be.not.null;
    });

    it('should return HTTP 400 when requested_for is no email address and not change sample status', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDNoEmailSample);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
      const lab_result: LabResult = await db.one(
        'SELECT * FROM lab_results WHERE id=$1',
        ['APISAMPLE_11111']
      );

      expect(lab_result.id).to.equal('APISAMPLE_11111');
      expect(lab_result.study_status).to.equal('active');
    });

    it('should return HTTP 403 when requested_for is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDWrongStudyPM);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when target proband is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDWrongStudyProband);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP  422 when target sample cannot be found in any study of the pm', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDWrongStudySample);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 422 when target sample is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDwrongSample);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 422 when target proband is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDwrongProband);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 422 when target pm is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDwrongFor);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 400 when type is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDwrongType);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 403 when targeted proband has a deletion request already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDConflictProband);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when targeted sample has a deletion request already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDConflictSample);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when targeted study has a deletion request already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(sysadminHeader1)
        .send(pDConflictStudy);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 but not yet update proband', async function () {
      const result: Response<PendingProbandDeletionDto> = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband4');

      const proband: Proband = await db.one(
        "SELECT * FROM probands WHERE pseudonym='ApiTestProband4'"
      );
      const account = (await db.one(
        'SELECT * FROM accounts WHERE username=$1',
        ['ApiTestProband4']
      )) as unknown;
      expect(proband.status).to.equal('active');
      expect(account).to.be.not.null;
    });

    it('should return HTTP 200 and update lab_result for sample pending deletion', async function () {
      const result: Response<PendingSampleDeletionDto> = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDValid2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('sample');
      expect(result.body.for_id).to.equal('APISAMPLE_11113');

      const lab_result: LabResult = await db.one(
        'SELECT * FROM lab_results WHERE id=$1',
        ['APISAMPLE_11113']
      );
      expect(lab_result.study_status).to.equal('deletion_pending');
    });

    it('should return HTTP 200 but not yet update proband if no_email_pm requests', async function () {
      const result: Response<PendingProbandDeletionDto> = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader3)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.requested_by).to.equal('pmNoEmail');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband4');

      const proband: Proband = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['ApiTestProband4']
      );
      const account = (await db.one(
        'SELECT * FROM accounts WHERE username=$1',
        ['ApiTestProband4']
      )) as unknown;
      expect(proband.status).to.equal('active');
      expect(account).to.be.not.null;
    });

    it('should return HTTP 200 and update study for study pending deletion', async function () {
      const result: Response<PendingStudyDeletionDto> = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(sysadminHeader1)
        .send(pDValid3);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.requested_by).to.equal('sa1@apitest.de');
      expect(result.body.requested_for).to.equal('sa2@apitest.de');
      expect(result.body.type).to.equal('study');
      expect(result.body.for_id).to.equal('ApiTestStudie2');

      const study: DbStudy = await db.one(
        "SELECT * FROM studies WHERE name='ApiTestStudie2'"
      );
      expect(study.name).to.equal('ApiTestStudie2');
      expect(study.status).to.equal('deletion_pending');
    });

    it('should forbid to create a pending deletion if no total opposition is not active', async function () {
      const result: Response<PendingStudyDeletionDto> = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader4)
        .send({
          requested_for: 'pm5@apitest.de',
          type: 'proband',
          for_id: 'ApiTestProband2',
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should directly delete a proband if four eye opposition is not active', async function () {
      const result: Response<PendingStudyDeletionDto> = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader4)
        .send({
          requested_for: 'pm4@apitest.de',
          type: 'proband',
          for_id: 'ApiTestProband3',
        });
      expect(result).to.have.status(StatusCodes.OK);

      const proband: Proband = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['ApiTestProband3']
      );
      const account = (await db.oneOrNone(
        'SELECT * FROM accounts WHERE username=$1',
        ['ApiTestProband3']
      )) as unknown;
      expect(proband.status).to.equal('deleted');
      expect(account).to.be.null;
    });

    it('should not process the deletion for someone else as requested_for if four eye opposition is not active', async function () {
      const result: Response<PendingStudyDeletionDto> = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader4)
        .send({
          requested_for: 'pm5@apitest.de',
          type: 'proband',
          for_id: 'ApiTestProband3',
        });
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });
  });

  describe('PUT pendingdeletions/id', function () {
    describe('wrong access', function () {
      before(async function () {
        await setup();
      });

      after(async function () {
        await cleanup();
      });

      it('should return HTTP 401 when the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(invalidHeader)
          .send({});
        expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
      });

      it('should return HTTP 403 when a proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(probandHeader1)
          .send({});
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 when a forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(forscherHeader1)
          .send({});
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 when a ut tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(utHeader1)
          .send({});
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 requested_by pm tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(pmHeader1)
          .send({});
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 requested_by sysadmin tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234562')
          .set(sysadminHeader1)
          .send({});
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 wrong pm tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(pmHeader3)
          .send({});
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });
    });

    describe('right access', function () {
      beforeEach(async function () {
        await setup();
      });

      afterEach(async function () {
        await cleanup();
      });

      it('should return HTTP 204 and delete all of probands data', async function () {
        const result: Response<PendingProbandDeletionDto> = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234561')
          .set(pmHeader2)
          .send({});
        expect(result).to.have.status(StatusCodes.NO_CONTENT);

        const lab_observations = await db.manyOrNone(
          'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1)',
          ['ApiTestProband1']
        );
        const lab_result = await db.manyOrNone(
          'SELECT * FROM lab_results WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const blood_sample = await db.manyOrNone(
          'SELECT * FROM blood_samples WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const questionnaire_instances = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const questionnaire_instances_queued = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances_queued WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const answers = await db.manyOrNone(
          'SELECT * FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE user_id=$1)',
          ['ApiTestProband1']
        );
        const user_images = await db.manyOrNone(
          'SELECT * FROM user_files WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const notification_schedules = await db.manyOrNone(
          'SELECT * FROM notification_schedules WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const proband: Proband = await db.one(
          'SELECT * FROM probands WHERE pseudonym=$1',
          ['ApiTestProband1']
        );
        const account = (await db.oneOrNone(
          'SELECT * FROM accounts WHERE username=$1',
          ['ApiTestProband1']
        )) as unknown;

        expect(account).to.be.null;

        expect(fetchMock.called('createSystemLog')).to.be.true;

        expect(lab_observations.length).to.equal(0);
        expect(lab_result.length).to.equal(0);
        expect(blood_sample.length).to.equal(0);
        expect(questionnaire_instances.length).to.equal(0);
        expect(questionnaire_instances_queued.length).to.equal(0);
        expect(answers.length).to.equal(0);
        expect(user_images.length).to.equal(0);
        expect(notification_schedules.length).to.equal(0);

        expect(proband.status).to.equal('deleted');
        expect(proband.first_logged_in_at).to.equal(null);
        expect(proband.compliance_labresults).to.equal(false);
        expect(proband.compliance_samples).to.equal(false);
        expect(proband.compliance_bloodsamples).to.equal(false);
        expect(proband.compliance_contact).to.equal(false);
        expect(proband.needs_material).to.equal(null);
        expect(proband.study_center).to.equal(null);
        expect(proband.examination_wave).to.equal(null);
      });

      it('should return HTTP 204 and delete all of samples data', async function () {
        const result: Response<PendingSampleDeletionDto> = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234562')
          .set(pmHeader2)
          .send({});
        expect(result).to.have.status(StatusCodes.NO_CONTENT);

        const lab_observations = await db.manyOrNone(
          "SELECT * FROM lab_observations WHERE lab_result_id='APISAMPLE_11111'"
        );
        const lab_result: LabResult = await db.one(
          "SELECT * FROM lab_results WHERE id='APISAMPLE_11111'"
        );
        expect(fetchMock.called('createSystemLog')).to.be.true;

        expect(lab_observations.length).to.equal(0);
        expect(lab_result.id).to.equal('APISAMPLE_11111');
        expect(lab_result.order_id).to.equal(null);
        expect(lab_result.status).to.equal(null);
        expect(lab_result.remark).to.equal(null);
        expect(lab_result.new_samples_sent).to.equal(null);
        expect(lab_result.performing_doctor).to.equal(null);
        expect(lab_result.dummy_sample_id).to.equal(null);
        expect(lab_result.study_status).to.equal('deleted');
      });

      it('should return HTTP 204 and delete all of study data', async function () {
        const result: Response<PendingStudyDeletionDto> = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234565')
          .set(sysadminHeader2)
          .send({});

        expect(result).to.have.status(StatusCodes.NO_CONTENT);

        const lab_observations = await db.manyOrNone(
          'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1)',
          ['ApiTestProband1']
        );
        const lab_result = await db.manyOrNone(
          'SELECT * FROM lab_results WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const blood_sample = await db.manyOrNone(
          'SELECT * FROM blood_samples WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const questionnaire_instances = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const questionnaire_instances_queued = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances_queued WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const answers = await db.manyOrNone(
          'SELECT * FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE user_id=$1)',
          ['ApiTestProband1']
        );
        const user_images = await db.manyOrNone(
          'SELECT * FROM user_files WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const notification_schedules = await db.manyOrNone(
          'SELECT * FROM notification_schedules WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const probands = await db.manyOrNone(
          'SELECT * FROM probands WHERE pseudonym=$1',
          ['ApiTestProband1']
        );
        const account = (await db.oneOrNone(
          'SELECT * FROM accounts WHERE username=$1',
          ['ApiTestProband1']
        )) as unknown;

        const planned_probands = await db.manyOrNone(
          'SELECT * FROM planned_probands WHERE user_id IN(SELECT user_id FROM study_planned_probands WHERE study_id=$1)',
          ['ApiTestStudie1']
        );
        const study_accesses = await db.manyOrNone(
          'SELECT * FROM study_users WHERE study_id=$1',
          ['ApiTestStudie1']
        );
        const questionnaires = await db.manyOrNone(
          'SELECT * FROM questionnaires WHERE study_id=$1',
          ['ApiTestStudie1']
        );
        const study: DbStudy = await db.one(
          'SELECT * FROM studies WHERE name=$1',
          ['ApiTestStudie1']
        );
        expect(fetchMock.called('createSystemLog')).to.be.true;

        expect(account).to.be.null;

        expect(lab_observations.length).to.equal(0);
        expect(lab_result.length).to.equal(0);
        expect(blood_sample.length).to.equal(0);
        expect(questionnaire_instances.length).to.equal(0);
        expect(questionnaire_instances_queued.length).to.equal(0);
        expect(answers.length).to.equal(0);
        expect(user_images.length).to.equal(0);
        expect(notification_schedules.length).to.equal(0);
        expect(study_accesses.length).to.equal(0);
        expect(questionnaires.length).to.equal(0);
        expect(probands.length).to.equal(0);
        expect(planned_probands.length).to.equal(0);

        expect(study.name).to.equal('ApiTestStudie1');
        expect(study.description).to.equal(null);
        expect(study.pm_email).to.equal(null);
        expect(study.hub_email).to.equal(null);
        expect(study.status).to.equal('deleted');
      });
    });
  });

  describe('DELETE pendingdeletions/id', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234560')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when pm of another study tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234560')
        .set(pmHeader4)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 204 and cancel deletion of proband data for requested_by pm', async function () {
      const id = 1234560;
      const result: Response<PendingProbandDeletionDto> = await chai
        .request(apiAddress)
        .delete(`/pendingdeletions/${id}`)
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);

      const proband: Proband = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['ApiTestProband2']
      );
      const account = (await db.oneOrNone(
        'SELECT * FROM accounts WHERE username=$1',
        ['ApiTestProband2']
      )) as unknown;
      const hasPendingDeletion =
        (await db.oneOrNone('SELECT * FROM pending_deletions WHERE id=$1', [
          id,
        ])) !== null;

      expect(hasPendingDeletion).to.be.false;
      expect(proband.status).to.equal('active');
      expect(account).to.be.not.null;
    });

    it('should return HTTP 204 and cancel deletion of proband data for requested_for pm', async function () {
      const id = 1234561;
      const result: Response<PendingProbandDeletionDto> = await chai
        .request(apiAddress)
        .delete(`/pendingdeletions/${id}`)
        .set(pmHeader2)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);

      const proband: Proband = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['ApiTestProband2']
      );
      const account = (await db.oneOrNone(
        'SELECT * FROM accounts WHERE username=$1',
        ['ApiTestProband2']
      )) as unknown;

      const hasPendingDeletion =
        (await db.oneOrNone('SELECT * FROM pending_deletions WHERE id=$1', [
          id,
        ])) !== null;

      expect(hasPendingDeletion).to.be.false;
      expect(proband.status).to.equal('active');
      expect(account).to.be.not.null;
    });

    it('should return HTTP 204 and cancel deletion of proband data for another pm of the same study', async function () {
      const id = 1234561;
      const result: Response<PendingProbandDeletionDto> = await chai
        .request(apiAddress)
        .delete(`/pendingdeletions/${id}`)
        .set(pmHeader3)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);

      const proband: Proband = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['ApiTestProband2']
      );
      const account = (await db.oneOrNone(
        'SELECT * FROM accounts WHERE username=$1',
        ['ApiTestProband2']
      )) as unknown;

      const hasPendingDeletion =
        (await db.oneOrNone('SELECT * FROM pending_deletions WHERE id=$1', [
          id,
        ])) !== null;

      expect(hasPendingDeletion).to.be.false;
      expect(proband.status).to.equal('active');
      expect(account).to.be.not.null;
    });

    it('should return HTTP 204 and cancel the deletion of sample data', async function () {
      const id = 1234562;
      const result: Response<PendingSampleDeletionDto> = await chai
        .request(apiAddress)
        .delete(`/pendingdeletions/${id}`)
        .set(pmHeader2)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);

      const lab_result: LabResult = await db.one(
        'SELECT * FROM lab_results WHERE id=$1',
        ['APISAMPLE_11111']
      );
      const hasPendingDeletion =
        (await db.oneOrNone('SELECT * FROM pending_deletions WHERE id=$1', [
          id,
        ])) !== null;

      expect(hasPendingDeletion).to.be.false;
      expect(lab_result.id).to.equal('APISAMPLE_11111');
      expect(lab_result.study_status).to.equal('active');
    });

    it('should return HTTP 204 and cancel the deletion of study data', async function () {
      const id = 1234565;
      const result: Response<PendingStudyDeletionDto> = await chai
        .request(apiAddress)
        .delete(`/pendingdeletions/${id}`)
        .set(sysadminHeader2)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);

      const study: DbStudy = await db.one(
        'SELECT * FROM studies WHERE name=$1',
        ['ApiTestStudie1']
      );
      const hasPendingDeletion =
        (await db.oneOrNone('SELECT * FROM pending_deletions WHERE id=$1', [
          id,
        ])) !== null;

      expect(hasPendingDeletion).to.be.false;
      expect(study.name).to.equal('ApiTestStudie1');
      expect(study.status).to.equal('active');
    });
  });
});
