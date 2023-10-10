/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueTopic } from '@pia/lib-messagequeue';
import { StatusCodes } from 'http-status-codes';
import { Server } from '../../src/server';

import { given } from './testBuilder';

/* eslint-disable @typescript-eslint/no-magic-numbers */

describe('/', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('/admin/studies/{studyName}/configuration', () => {
    it(
      'POST & GET should work',
      given()
        .createConfiguration()
        .expectResponseStatus(StatusCodes.OK)
        .withIdsFromResponse()
        .getConfiguration()
        .expectResponseStatus(StatusCodes.OK)
        .expectResponseConfiguration()
        .build()
    );

    it(
      'POST should send a message to MQ',
      given()
        .withMessageQueueConsumer()
        .createConfiguration()
        .expectMessages(
          MessageQueueTopic.FEEDBACKSTATISTIC_CONFIGURATION_UPDATED
        )
        .build()
    );

    it(
      'GET for non existing should return 404',
      given()
        .getConfiguration()
        .expectResponseStatus(StatusCodes.NOT_FOUND)
        .build()
    );

    it(
      'DELETE for existing should remove configuration',
      given()
        .createConfiguration()
        .expectResponseStatus(StatusCodes.OK)
        .withIdsFromResponse()
        .deleteConfiguration()
        .expectResponseStatus(StatusCodes.NO_CONTENT)
        .getConfiguration()
        .expectResponseStatus(StatusCodes.NOT_FOUND)
        .build()
    );

    it(
      'PUT for existing should update',
      given()
        .createConfiguration()
        .expectResponseStatus(StatusCodes.OK)
        .withIdsFromResponse()
        .withConfigurationUpdate({
          title: 'some-new-title',
        })
        .updateConfiguration()
        .expectResponseStatus(StatusCodes.OK)
        .expectResponseConfiguration()
        .getConfiguration()

        .expectResponseStatus(StatusCodes.OK)
        .expectResponseConfiguration()
        .build()
    );

    it(
      'PUT with different timeSeries should update',
      given()
        .createConfiguration()
        .expectResponseStatus(StatusCodes.OK)
        .withIdsFromResponse()
        .withConfigurationUpdate({
          timeSeries: [
            {
              answerOptionValueCodes: {
                id: 9845345,
                valueCodes: [645, 234, 678],
                variableName: 'some-other-variable-name',
              },
              color: '#F00BAA',
              label: 'another-label-again',
              questionnaire: {
                id: 345345,
                version: 13242534,
              },
            },
          ],
        })
        .updateConfiguration()
        .withIdsFromResponse()
        .expectResponseStatus(StatusCodes.OK)
        .expectResponseConfiguration()
        .getConfiguration()

        .expectResponseStatus(StatusCodes.OK)
        .expectResponseConfiguration()
        .build()
    );

    it(
      'PUT with different comparativeValues should update',
      given()
        .createConfiguration()
        .expectResponseStatus(StatusCodes.OK)
        .withIdsFromResponse()
        .withConfigurationUpdate({
          comparativeValues: {
            answerOptionValueCodes: {
              id: 456456,
              valueCodes: [8345, 2234],
              variableName: 'some-new-variable-name',
            },
            questionnaire: {
              id: 334556,
              version: 98459,
            },
          },
        })
        .updateConfiguration()
        .expectResponseStatus(StatusCodes.OK)
        .expectResponseConfiguration()
        .getConfiguration()

        .expectResponseStatus(StatusCodes.OK)
        .expectResponseConfiguration()
        .build()
    );
  });

  describe('studyName must be checked', () => {
    it(
      'POST with a different studyName than route name must produce an error',
      given()
        .withConfigurationUpdate({
          study: 'another-study-name',
        })
        .createConfiguration()
        .expectResponseStatus(StatusCodes.BAD_REQUEST)
        .build()
    );

    it(
      'PUT with a different studyName than in route name must produce an error',
      given()
        .withConfigurationUpdate({
          study: 'another-study-name',
        })
        .updateConfiguration()
        .expectResponseStatus(StatusCodes.BAD_REQUEST)
        .build()
    );

    it(
      'GET with a different studyName than existing must produce an error',
      given()
        .createConfiguration()
        .withIdsFromResponse()
        .withStudy('another-study')
        .getConfiguration()
        .expectResponseStatus(StatusCodes.NOT_FOUND)
        .build()
    );

    it(
      'PUT with a different studyName than existing must produce an error',
      given()
        .createConfiguration()
        .withIdsFromResponse()
        .withStudy('another-study')
        .updateConfiguration()
        .expectResponseStatus(StatusCodes.NOT_FOUND)
        .build()
    );

    it(
      'DELETE with a different studyName than existing must produce an error',
      given()
        .createConfiguration()
        .withIdsFromResponse()
        .withStudy('another-study')
        .deleteConfiguration()
        .expectResponseStatus(StatusCodes.NOT_FOUND)
        .build()
    );
  });

  describe('configurationId must be checked', () => {
    it(
      'PUT will only process id from route',
      given()
        .createConfiguration()
        .withIdsFromResponse()
        .withConfigurationUpdate({
          id: 12345543354,
        })
        .updateConfiguration()
        .getConfiguration()
        .withConfigurationUpdate({
          id: 10,
        })
        .expectResponseConfiguration()
        .expectResponseStatus(StatusCodes.OK)
        .build()
    );

    it(
      'PUT with a non numeric id must produce an error',
      given()
        .withId('12a4' as unknown as number)
        .updateConfiguration()
        .expectResponseStatus(StatusCodes.BAD_REQUEST)
        .build()
    );
  });

  describe('as proband', () => {
    it(
      'GET should be forbidden',
      given()
        .withProbandRole()
        .getConfiguration()
        .expectResponseStatus(StatusCodes.FORBIDDEN)
        .build()
    );

    it(
      'POST should be forbidden',
      given()
        .withProbandRole()
        .createConfiguration()
        .expectResponseStatus(StatusCodes.FORBIDDEN)
        .build()
    );

    it(
      'PUT should be forbidden',
      given()
        .withProbandRole()
        .updateConfiguration()
        .expectResponseStatus(StatusCodes.FORBIDDEN)
        .build()
    );

    it(
      'DELETE should be forbidden',
      given()
        .withProbandRole()
        .deleteConfiguration()
        .expectResponseStatus(StatusCodes.FORBIDDEN)
        .build()
    );
  });

  describe('for a different study', () => {
    it(
      'GET should be forbidden',
      given()
        .withAllowedStudy('another-study')
        .getConfiguration()
        .expectResponseStatus(StatusCodes.FORBIDDEN)
        .build()
    );

    it(
      'POST should be forbidden',
      given()
        .withAllowedStudy('another-study')
        .createConfiguration()
        .expectResponseStatus(StatusCodes.FORBIDDEN)
        .build()
    );

    it(
      'PUT should be forbidden',
      given()
        .withAllowedStudy('another-study')
        .withId(123)
        .updateConfiguration()
        .expectResponseStatus(StatusCodes.FORBIDDEN)
        .build()
    );

    it(
      'DELETE should be forbidden',
      given()
        .withAllowedStudy('another-study')
        .deleteConfiguration()
        .expectResponseStatus(StatusCodes.FORBIDDEN)
        .build()
    );
  });
});
