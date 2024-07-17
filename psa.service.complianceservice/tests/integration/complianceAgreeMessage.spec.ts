/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiExclude from 'chai-exclude';
import { StatusCodes } from 'http-status-codes';
import sinon, { createSandbox, SinonSandbox } from 'sinon';
import * as util from 'util';
import fetchMocker from 'fetch-mock';

import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { Server } from '../../src/server';
import { Compliance, ComplianceText, sequelize } from '../../src/db';
import { messageQueueService } from '../../src/services/messageQueueService';
import { config } from '../../src/config';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { MessageQueueTopic } from '@pia/lib-messagequeue';

const expect = chai.expect;
chai.use(chaiHttp);
chai.use(chaiExclude);

const testSandbox = sinon.createSandbox();

const apiAddress = `http://localhost:${config.public.port}`;

const delay = util.promisify(setTimeout);
const DELAY_TIME = 10;

const probandHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTeststudie1'],
});
const probandHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband2',
  studies: ['QTeststudie44'],
});

const compl = {
  username: 'qtest-proband1',
  study: 'QTeststudie1',
  timestamp: '2020-05-29 10:17:02',
  complianceText: 'newest',
  firstname: 'Test',
  lastname: 'Proband',
  location: null,
  birthdate: '1972-06-22',
  complianceApp: true,
  complianceBloodsamples: true,
  complianceLabresults: false,
  complianceSamples: false,
};

const compl_req = {
  compliance_text: 'newest',
  compliance_system: {
    app: true,
    bloodsamples: true,
    labresults: false,
    samples: false,
  },
  textfields: {
    birthdate: '1972-06-22',
    firstname: 'Test',
    lastname: 'Proband',
  },
  compliance_questionnaire: [],
};

const compl_res = {
  compliance_text: 'newest',
  compliance_text_object: [
    {
      html: '<p>newest</p>',
      type: 'HTML',
    },
  ],
  compliance_system: {
    app: true,
    bloodsamples: true,
    labresults: false,
    samples: false,
  },
  textfields: {
    birthdate: '1972-06-22',
    firstname: 'Test',
    lastname: 'Proband',
    location: null,
  },
  compliance_questionnaire: [],
  timestamp: '2020-05-29 10:17:02',
};

const sandbox: SinonSandbox = createSandbox();
const fetchMock = fetchMocker.sandbox();

describe('Compliance API with MessageQueue', () => {
  before(async () => {
    await sequelize.sync();
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  beforeEach(async () => {
    await Compliance.destroy({ truncate: true, cascade: true });
    await ComplianceText.destroy({ truncate: true, cascade: true });

    sandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
    AuthServerMock.probandRealm().returnValid();
  });

  afterEach(() => {
    AuthServerMock.cleanAll();
    sandbox.restore();
    fetchMock.restore();
  });

  describe('POST /{studyName}/agree/{userId}', () => {
    beforeEach(() => {
      fetchMock
        .get('express:/user/users/qtest-proband1/ids', {
          body: 'fff70d12-847e-4d73-97ba-24d1571e37ab',
        })
        .get('express:/user/users/qtest-proband1/mappingId', {
          body: 'e959c22a-ab73-4b70-8871-48c23080b87b',
        })
        .catch(StatusCodes.SERVICE_UNAVAILABLE);
    });

    afterEach(() => {
      testSandbox.restore();
      fetchMock.restore();
    });

    it('should return http 200 and update if compliance_text exists', async () => {
      let pseudonym: string | undefined;
      await messageQueueService.createConsumer(
        MessageQueueTopic.COMPLIANCE_CREATED,
        async (message) => {
          pseudonym = message.pseudonym;
          return Promise.resolve();
        }
      );

      const now = Date.now();
      await ComplianceText.create({
        study: 'QTeststudie1',
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Proband',
      });
      const res = await chai
        .request(apiAddress)
        .post('/QTeststudie1/agree/qtest-proband1')
        .set(probandHeader)
        .send(compl_req);

      expect(res).to.have.status(StatusCodes.OK);
      expect(res.body).to.haveOwnProperty('timestamp');
      expect(res.body).excluding('timestamp').to.deep.equal(compl_res);
      const complDb = await Compliance.findOne({
        where: {
          mappingId: 'e959c22a-ab73-4b70-8871-48c23080b87b',
          study: 'QTeststudie1',
        },
      });
      expect(new Date(complDb?.timestamp as Date).getTime()).to.be.greaterThan(
        now - 1
      );
      expect(complDb?.complianceText).to.equal(compl.complianceText);

      while (pseudonym !== 'qtest-proband1') {
        await delay(DELAY_TIME);
      }
    });

    it('should return 403 if an unauthorized proband tries', async () => {
      const res = await chai
        .request(apiAddress)
        .post('/QTeststudie1/agree/qtest-proband2')
        .set(probandHeader2)
        .send(compl_req);
      expect(res).to.have.status(StatusCodes.FORBIDDEN);
    });
  });
});
