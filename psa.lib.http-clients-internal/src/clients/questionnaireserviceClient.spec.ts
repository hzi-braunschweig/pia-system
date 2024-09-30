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
import { Readable } from 'stream';

import { HttpClient } from '../core/httpClient';
import { QuestionnaireserviceClient } from './questionnaireserviceClient';
import { CreateQuestionnaireInstanceInternalDto } from '../dtos/questionnaireInstance';
import * as os from 'os';
import ReadableStream = NodeJS.ReadableStream;

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

  describe('getQuestionnaire', () => {
    it('should call questionnaireservice to get a questionnaire', async () => {
      // Arrange
      const id = 1;
      const version = 1;
      fetchMock.get(
        {
          url: 'express:/questionnaire/1/1',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify({}),
        }
      );

      // Act
      await client.getQuestionnaire(id, version);

      // Assert
      expect(
        fetchMock.called('express:/questionnaire/1/1', {
          method: 'GET',
        })
      ).to.be.true;
    });
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

  describe('createQuestionnaireInstances', () => {
    it('should call questionnaire service to create questionnaire instances', async () => {
      // Arrange
      const pseudonym1 = 'QTestProband1';
      const questionnaireId = 1234;
      const dateOfIssue = new Date();
      const instancesFixture: CreateQuestionnaireInstanceInternalDto[] = [
        {
          studyId: 'QTestStudy',
          pseudonym: pseudonym1,
          questionnaireName: 'Questionnaire A',
          questionnaireId,
          questionnaireVersion: 1,
          sortOrder: null,
          dateOfIssue,
          cycle: 1,
          status: 'inactive',
          origin: null,
        },
        {
          studyId: 'QTestStudy',
          pseudonym: pseudonym1,
          questionnaireName: 'Questionnaire A',
          questionnaireId,
          questionnaireVersion: 1,
          sortOrder: null,
          dateOfIssue,
          cycle: 2,
          status: 'inactive',
          origin: null,
        },
      ];

      fetchMock.post(
        {
          url: 'express:/questionnaire/questionnaireInstances',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(instancesFixture),
        }
      );

      // Act
      const result = await client.createQuestionnaireInstances(
        instancesFixture
      );

      // Assert
      expect(
        fetchMock.called('express:/questionnaire/questionnaireInstances', {
          method: 'POST',
        })
      ).to.be.true;

      expect(result).to.deep.equal(
        JSON.parse(JSON.stringify(instancesFixture))
      );
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

      // Act
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

  describe('getQuestionnaireAnswers', () => {
    it("should call questionnaireservice to get a questionnaire's answers", async () => {
      // Arrange
      const questionnaireId = 1234;
      fetchMock.get(
        {
          url: 'glob:http://questionnaireservice:5000/questionnaire/1234/answers?*',
        },
        createAnswersReadable(),
        { sendAsJson: false }
      );

      await client.getQuestionnaireAnswers(questionnaireId, {});

      // Assert
      expect(
        fetchMock.called(
          'http://questionnaireservice:5000/questionnaire/1234/answers?',
          {
            method: 'GET',
          }
        )
      ).to.be.true;
    });

    it('should call questionnaireservice to get answers with specific status', async () => {
      // Arrange
      const questionnaireId = 1234;
      fetchMock.get(
        {
          url: 'glob:http://questionnaireservice:5000/questionnaire/1234/answers?*',
        },
        createAnswersReadable(),
        { sendAsJson: false }
      );

      await client.getQuestionnaireAnswers(questionnaireId, {
        status: ['active', 'in_progress'],
      });

      // Assert
      expect(
        fetchMock.called(
          'http://questionnaireservice:5000/questionnaire/1234/answers?status=active&status=in_progress',
          {
            method: 'GET',
          }
        )
      ).to.be.true;
    });

    it('should call questionnaireservice to get answers with date boundaries', async () => {
      // Arrange
      const questionnaireId = 1234;
      fetchMock.get(
        {
          url: 'glob:http://questionnaireservice:5000/questionnaire/1234/answers?*',
        },
        createAnswersReadable(),
        { sendAsJson: false }
      );

      await client.getQuestionnaireAnswers(questionnaireId, {
        minDateOfIssue: new Date('2020-01-01'),
        maxDateOfIssue: new Date('2020-12-31'),
      });

      // Assert
      expect(
        fetchMock.called(
          'http://questionnaireservice:5000/questionnaire/1234/answers?minDateOfIssue=2020-01-01T00%3A00%3A00.000Z&maxDateOfIssue=2020-12-31T00%3A00%3A00.000Z',
          {
            method: 'GET',
          }
        )
      ).to.be.true;
    });

    it('should call questionnaireservice to get answers with specified answer options', async () => {
      // Arrange
      const questionnaireId = 1234;
      fetchMock.get(
        {
          url: 'glob:http://questionnaireservice:5000/questionnaire/1234/answers?*',
        },
        createAnswersReadable(),
        { sendAsJson: false }
      );

      await client.getQuestionnaireAnswers(questionnaireId, {
        answerOptions: [{ id: 1 }, { variableName: 'someVar' }, { id: 2 }],
      });

      // Assert
      expect(
        fetchMock.called(
          'http://questionnaireservice:5000/questionnaire/1234/answers?answerOptionIds=1&answerOptionIds=2&answerOptionVariableNames=someVar',
          {
            method: 'GET',
          }
        )
      ).to.be.true;
    });

    it('should redirect a 404 error', async () => {
      // Arrange
      const questionnaireId = 1234;
      fetchMock.get(
        {
          url: 'glob:http://questionnaireservice:5000/questionnaire/1234/answers?*',
        },
        { status: StatusCodes.NOT_FOUND }
      );

      // Act
      const clientFn = client.getQuestionnaireAnswers(questionnaireId, {});

      // Assert
      await expect(clientFn).be.rejectedWith(
        'GET http://questionnaireservice:5000/questionnaire/1234/answers? received a 404 Not Found'
      );
    });

    it('should return an internal error', async () => {
      // Arrange
      const questionnaireId = 1234;
      fetchMock.get(
        {
          url: 'glob:http://questionnaireservice:5000/questionnaire/1234/answers?*',
        },
        { status: StatusCodes.BAD_GATEWAY }
      );

      // Act
      const clientFn = client.getQuestionnaireAnswers(questionnaireId, {});

      // Assert
      await expect(clientFn).be.rejectedWith(
        'GET http://questionnaireservice:5000/questionnaire/1234/answers? received an Error'
      );
    });
  });

  function createAnswersReadable(): ReadableStream {
    function* generate(): Generator<string> {
      yield JSON.stringify({
        questionnaireId: 123,
        questionnaireInstanceId: 123001,
        questionnaireInstanceDateOfIssue: '2023-01-02T07:00:00.000Z',
        answerOptionId: 456,
        values: ['yes'],
      }) + os.EOL;
      yield JSON.stringify({
        questionnaireId: 123,
        questionnaireInstanceId: 123002,
        questionnaireInstanceDateOfIssue: '2023-01-02T07:00:00.000Z',
        answerOptionId: 456,
        values: ['no'],
      }) + os.EOL;
    }

    return Readable.from(generate());
  }
});
