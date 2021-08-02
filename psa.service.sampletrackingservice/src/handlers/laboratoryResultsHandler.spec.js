/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const laboratoryResultsHandler = require('./laboratoryResultsHandler');
const laboratoryResultsInteractor = require('../interactors/laboratoryResultsInteractor');
const laboratoryResultTemplateService = require('../services/laboratoryResultTemplateService');
const templatePipelineService = require('../services/templatePipelineService');
const sinon = require('sinon');
const httpMocks = require('node-mocks-http');
const { expect } = require('chai');

const laboratoryResultsAsJson = {
  labResultID: 'labResultID:1003',
  date_of_analysis: '11.01.2012',
  date_of_delivery: '10.01.2012',
  date_of_sampling: '09.01.2012',
  comment: 'This is as simple comment',
  lab_observations: [
    {
      performing_doctor: 'Dr. Strange',
      result_bool: true,
      result_value: 120,
    },
  ],
};
const laboratoryResultsAsHtml = '<some-html></some-html>';
const credentials = { username: 'QTest-1234567890', role: 'any' };

const labPromise = new Promise(function (resolve) {
  resolve(laboratoryResultsAsJson);
});

describe('Get all laboratory results from database', () => {
  const getAllLaboratoryResultsRequest = httpMocks.createRequest({
    method: 'GET',
    url: '/laboratory-results',
    headers: {
      authorization: 'barerToken',
    },
  });
  getAllLaboratoryResultsRequest.auth = { credentials };
  before(() => {
    const getLaboratoryResultsInteractor = sinon.stub(
      laboratoryResultsInteractor,
      'getAllLaboratoryResults'
    );
    getLaboratoryResultsInteractor.withArgs(credentials).returns(labPromise);
  });
  it('should reply with laboratory Results', async () => {
    const result = await laboratoryResultsHandler.getAllResults(
      getAllLaboratoryResultsRequest
    );
    expect(result).to.equal(laboratoryResultsAsJson);
  });
});

describe('Get one laboratory result', () => {
  before(() => {
    const getOneLaboratoryResultsInteractor = sinon.stub(
      laboratoryResultsInteractor,
      'getOneLaboratoryResult'
    );
    getOneLaboratoryResultsInteractor
      .withArgs(credentials, 'some-user', 'labResultID:1003')
      .returns(labPromise);

    const getTemplate = sinon.stub(
      laboratoryResultTemplateService,
      'getTemplate'
    );
    getTemplate.returns('some markdown template');

    const generateLaboratoryResult = sinon.stub(
      templatePipelineService,
      'generateLaboratoryResult'
    );
    generateLaboratoryResult
      .withArgs(laboratoryResultsAsJson, 'some markdown template')
      .resolves(laboratoryResultsAsHtml);
  });

  after(function () {
    sinon.restore();
  });

  it('should reply with one laboratory result as json', async () => {
    const result = await laboratoryResultsHandler.getOneResult(createRequest());
    expect(result).to.equal(laboratoryResultsAsJson);
  });

  it('should reply with one laboratory result as html', async () => {
    const result = await laboratoryResultsHandler.getOneResult(
      createRequest('text/html')
    );
    expect(result).to.equal(laboratoryResultsAsHtml);
  });

  function createRequest(acceptHeader = 'application/json') {
    const request = httpMocks.createRequest({
      method: 'GET',
      url: '/laboratory-results/labResultID:1003',
      headers: {
        accept: acceptHeader,
        authorization: 'bearerToken',
      },
      params: {
        user_id: 'some-user',
        result_id: 'labResultID:1003',
      },
    });
    request.auth = { credentials };
    return request;
  }
});
