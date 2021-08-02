/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT;
const questionnaireInstancesService = require('../../src/services/questionnaireInstancesService.js');
const { ListeningDbClient } = require('@pia/lib-service-core');
const sandbox = require('sinon').createSandbox();

describe('/metrics', () => {
  before(async () => {
    sandbox.stub(
      questionnaireInstancesService,
      'checkAndUploadQuestionnaireInstances'
    );
    sandbox.stub(ListeningDbClient.prototype);
    await server.init();
  });

  after(async () => {
    await server.stop();
    sandbox.restore();
  });

  describe('GET /metrics', async () => {
    it('should return http 200 with a string', async () => {
      const result = await chai.request(apiAddress).get('/metrics');
      expect(result).to.have.status(200);
      expect(result.text).to.be.an('string');
    });
  });
});
