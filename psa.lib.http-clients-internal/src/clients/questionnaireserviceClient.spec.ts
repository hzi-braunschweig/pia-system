/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fetchMocker from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { createSandbox } from 'sinon';

import { HttpClient } from '../core/httpClient';
import { QuestionnaireserviceClient } from './questionnaireserviceClient';

chai.use(chaiAsPromised);

const testSandbox = createSandbox();

describe('QuestionnaireserviceClient', () => {
  const fetchMock = fetchMocker.sandbox();

  let client: QuestionnaireserviceClient;

  beforeEach(() => {
    client = new QuestionnaireserviceClient('http://questionnaireservice:5000');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('getQuestionnaireInstancesForProband', () => {
    it('should call questionnaireservice to get all qis of a proband', async () => {
      // Arrange
      const pseudonym = 'TEST-1234';
      fetchMock.get(
        {
          url: 'express:/questionnaire/user/TEST-1234/questionnaireInstances',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify([]),
        }
      );

      await client.getQuestionnaireInstancesForProband(pseudonym);

      // Assert
      expect(
        fetchMock.called(
          'express:/questionnaire/user/TEST-1234/questionnaireInstances',
          {
            method: 'GET',
          }
        )
      ).to.be.true;
    });
  });

  describe('getQuestionnaireInstance', () => {
    it('should call questionnaireservice to get a questionnaire instance', async () => {
      // Arrange
      const questionnaireInstanceId = 1234;
      fetchMock.get(
        {
          url: 'express:/questionnaire/questionnaireInstances/1234',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify({
            id: 1234,
            dateOfIssue: '2020-12-06',
            questionnaire: { id: 999 },
          }),
        }
      );

      await client.getQuestionnaireInstance(questionnaireInstanceId);

      // Assert
      expect(
        fetchMock.called('express:/questionnaire/questionnaireInstances/1234', {
          method: 'GET',
        })
      ).to.be.true;
    });
  });

  describe('getQuestionnaireInstanceAnswers', () => {
    it("should call questionnaireservice to get a questionnaire instances' answers", async () => {
      // Arrange
      const questionnaireInstanceId = 1234;
      fetchMock.get(
        {
          url: 'express:/questionnaire/questionnaireInstances/1234/answers',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify([]),
        }
      );

      await client.getQuestionnaireInstanceAnswers(questionnaireInstanceId);

      // Assert
      expect(
        fetchMock.called(
          'express:/questionnaire/questionnaireInstances/1234/answers',
          {
            method: 'GET',
          }
        )
      ).to.be.true;
    });
  });
});
