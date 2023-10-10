/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Response as ChaiResponse } from '@pia/lib-service-core';
import { Response } from 'superagent';
import {
  cleanup,
  setup,
} from './internalQuestionnaireAnswers.spec.data/setup.helper';

import { Server } from '../../src/server';
import { config } from '../../src/config';
import { StatusCodes } from 'http-status-codes';
import { AnswerDataDto } from '../../src/models/answer';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: Questionnaire answers', function () {
  before(async function () {
    await Server.init();
    await setup();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
  });

  describe('GET /questionnaire/{id}/answers', function () {
    it('should return all answers as stream', async function () {
      // Arrange
      const expectedLength = 4;

      // Act
      const result: ChaiResponse<Buffer> = await chai
        .request(apiAddress)
        .get('/questionnaire/666666/answers')
        .parse(binaryParser)
        .buffer();
      const body = JSON.parse(result.body.toString()) as AnswerDataDto[];

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(body).to.have.lengthOf(expectedLength);

      expect(body[0]).to.deep.equal({
        questionnaireId: 666666,
        questionnaireInstanceId: 666671,
        questionnaireInstanceDateOfIssue: '2017-08-07T22:00:00.000Z',
        answerOptionId: 666666,
        answerOptionVariableName: 'var1',
        values: ['Ja'],
      });
      expect(body[1]).to.deep.equal({
        questionnaireId: 666666,
        questionnaireInstanceId: 666671,
        questionnaireInstanceDateOfIssue: '2017-08-07T22:00:00.000Z',
        answerOptionId: 666667,
        answerOptionVariableName: 'var2',
        values: ['Husten', 'Schnupfen'],
      });
      expect(body[2]).to.deep.equal({
        questionnaireId: 666666,
        questionnaireInstanceId: 666671,
        questionnaireInstanceDateOfIssue: '2017-08-07T22:00:00.000Z',
        answerOptionId: 666668,
        answerOptionVariableName: 'var3',
        values: ['42'],
      });
      expect(body[3]).to.deep.equal({
        questionnaireId: 666666,
        questionnaireInstanceId: 666671,
        questionnaireInstanceDateOfIssue: '2017-08-07T22:00:00.000Z',
        answerOptionId: 666669,
        answerOptionVariableName: 'var4',
        values: ['Mir geht es eigentlich nicht so gut...'],
      });
    });

    it('should return answers based on filter', async function () {
      // Arrange
      const urlParams = new URLSearchParams([
        ['status', 'released_once'],
        ['status', 'released_twice'],
        ['minDateOfIssue', '2017-08-07T22:00:00.000Z'],
        ['maxDateOfIssue', '2017-08-09T22:00:00.000Z'],
        ['answerOptionIds', '666666'],
        ['answerOptionVariableNames', 'doesnotexist'],
      ]);

      // Act
      const result: ChaiResponse<Buffer> = await chai
        .request(apiAddress)
        .get('/questionnaire/666666/answers?' + urlParams.toString())
        .parse(binaryParser)
        .buffer();
      const body = JSON.parse(result.body.toString()) as AnswerDataDto[];

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(body).to.have.lengthOf(1);

      expect(body[0]).to.deep.equal({
        questionnaireId: 666666,
        questionnaireInstanceId: 666671,
        questionnaireInstanceDateOfIssue: '2017-08-07T22:00:00.000Z',
        answerOptionId: 666666,
        answerOptionVariableName: 'var1',
        values: ['Ja'],
      });
    });
  });
});

function binaryParser(
  res: Response,
  cb: (err: Error | null, body: Buffer) => void
): void {
  const data: unknown[] = [];
  res.setEncoding('binary');
  res.on('data', function (chunk: string) {
    data.push(JSON.parse(chunk));
  });
  res.on('end', function () {
    cb(null, Buffer.from(JSON.stringify(data)));
  });
  res.on('error', function (err: Error) {
    cb(err, Buffer.from(''));
  });
}
