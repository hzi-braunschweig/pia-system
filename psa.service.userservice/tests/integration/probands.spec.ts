/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import server from '../../src/server';
import { cleanup, setup } from './probands.spec.data/setup.helper';
import { createSandbox } from 'sinon';
import chaiHttp from 'chai-http';
import { config } from '../../src/config';
import chai, { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import JWT from 'jsonwebtoken';
import secretOrPrivateKey from '../secretOrPrivateKey';
import { Proband } from '../../src/models/proband';

chai.use(chaiHttp);

const probandSession = { id: 1, role: 'Proband', username: 'QTestProband1' };
const researcherSession = {
  id: 1,
  role: 'Forscher',
  username: 'researcher1@example.com',
};
const investigatorSession = {
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
  groups: ['QTestStudy1'],
};

const probandHeader = {
  authorization: JWT.sign(probandSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const researcherHeader = {
  authorization: JWT.sign(researcherSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const investigatorHeader = {
  authorization: JWT.sign(investigatorSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const sysadminHeader = {
  authorization: JWT.sign(sysadminSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const pmHeader = {
  authorization: JWT.sign(pmSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};

describe('/user/studies/{studyName}/probands', () => {
  const testSandbox = createSandbox();
  const apiAddress = `http://localhost:${config.public.port}`;

  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  beforeEach(async function () {
    await setup();
  });

  afterEach(async function () {
    await cleanup();
    testSandbox.restore();
  });

  describe('GET /user/studies/{studyName}/probands', () => {
    it('should return 401 if no token is applied', async () => {
      const studyName = 'QTestStudy1';
      const response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`);
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if user is not a proband manager', async () => {
      const studyName = 'QTestStudy1';
      let response;
      response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(researcherHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(probandHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(investigatorHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(sysadminHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 403 if proband manager is not in the study', async () => {
      const studyName = 'QTestStudy2';
      const response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(pmHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 200 if proband manager is not in the study', async () => {
      const studyName = 'QTestStudy1';
      const response: { body: Proband[] } = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(pmHeader);
      expect(response).to.have.status(StatusCodes.OK);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.length(2);
      response.body.forEach((p) => {
        expect(p).to.include({ study: studyName });
      });
      const proband1 = response.body.find(
        (p) => p.username === 'QTestProband1'
      );
      expect(proband1).to.not.be.undefined;
      const expectedAttributes: Partial<Proband> = {
        ids: null,
        accountStatus: 'active',
        studyStatus: 'active',
      };
      expect(proband1).to.include(expectedAttributes);
      const proband4 = response.body.find(
        (p) => p.username === 'QTestProband4'
      );
      expect(proband4).to.not.be.undefined;
      expect(proband4).to.include(expectedAttributes);
    });
  });
});
