/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import {
  cleanup,
  setup,
} from './internalQuestionnaireInstances.spec.data/setup.helper';

import { Server } from '../../src/server';
import { config } from '../../src/config';
import { StatusCodes } from 'http-status-codes';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: QuestionnaireInstance answers', function () {
  before(async function () {
    await Server.init();
    await setup();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
  });

  describe('GET answers', function () {
    it('should contain answerOptions', async function () {
      // Arrange
      const expectedLength = 4;

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/questionnaire/questionnaireInstances/666671/answers');

      // Assert
      expect(result).to.have.status(StatusCodes.OK);

      expect(result.body).to.have.lengthOf(expectedLength);

      expect(result.body).to.deep.include({
        versioning: 1,
        value: 'Ja',
        dateOfRelease: null,
        releasingPerson: null,
        answerOption: {
          id: 666666,
          position: 1,
          text: 'Q1Frage1Sub1',
          answerTypeId: 1,
          isConditionTarget: false,
          isDecimal: null,
          isNotable: [],
          variableName: '',
          restrictionMax: null,
          restrictionMin: null,
          values: ['Ja', 'Nein', 'Keine Angabe'],
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          valuesCode: [1, 0, 2],
        },
      });

      expect(result.body).to.deep.include({
        versioning: 1,
        value: 'Husten;Schnupfen',
        dateOfRelease: null,
        releasingPerson: null,
        answerOption: {
          id: 666667,
          position: 2,
          text: 'Q1Frage1Sub2',
          answerTypeId: 2,
          isConditionTarget: false,
          isDecimal: null,
          isNotable: [],
          variableName: '',
          restrictionMax: null,
          restrictionMin: null,
          values: ['Husten', 'Schnupfen', 'Schmerzen', 'Wehwehchen'],
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          valuesCode: [1, 2, 3, 4],
        },
      });

      expect(result.body).to.deep.include({
        versioning: 1,
        value: '42',
        dateOfRelease: null,
        releasingPerson: null,
        answerOption: {
          id: 666668,
          position: 1,
          text: 'Q1Frage2Sub1',
          answerTypeId: 3,
          isConditionTarget: false,
          isDecimal: null,
          isNotable: [],
          variableName: '',
          restrictionMax: null,
          restrictionMin: null,
          values: null,
          valuesCode: null,
        },
      });

      expect(result.body).to.deep.include({
        versioning: 1,
        value: 'Mir geht es eigentlich nicht so gut...',
        dateOfRelease: null,
        releasingPerson: null,
        answerOption: {
          id: 666669,
          position: 2,
          text: 'Q1Frage2Sub2',
          answerTypeId: 4,
          isConditionTarget: false,
          isDecimal: null,
          isNotable: [],
          variableName: '',
          restrictionMax: null,
          restrictionMin: null,
          values: null,
          valuesCode: null,
        },
      });
    });
  });
});
