/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { getRepository } from 'typeorm';
import chaiHttp from 'chai-http';
import chai, { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';

import { Response } from '@pia/lib-service-core';
import { Server } from '../../src/server';
import { Questionnaire } from '../../src/entities/questionnaire';
import { db } from '../../src/db';
import { config } from '../../src/config';
import { createQuestionnaire } from './instanceCreator.helper';
import { QuestionnaireDto } from '../../src/models/questionnaire';

chai.use(chaiHttp);
const apiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: Questionnaire', () => {
  before(async () => {
    await db.none("INSERT INTO studies(name) VALUES ('QTestStudy')");
    await Server.init();
    await getRepository(Questionnaire).save(
      createQuestionnaire({ id: 1234, version: 1 })
    );
  });

  after(async () => {
    await getRepository(Questionnaire).delete({ id: 1234, version: 1 });
    await Server.stop();
    await db.none("DELETE FROM studies WHERE name LIKE 'QTest%'");
  });

  describe('GET /questionnaire/{id}/{version}', () => {
    it('should return 200 and fetch the questionnaire', async () => {
      const result: Response<QuestionnaireDto> = await chai
        .request(apiAddress)
        .get('/questionnaire/1234/1');

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(1234);
      expect(result.body.version).to.equal(1);
      expect(result.body.notificationLinkToOverview).to.equal(true);
      expect(result.body.questions).to.have.length(2);
      expect(result.body.questions[0].answerOptions).to.have.length(5);
    });

    it('should return 404 if questionnaire does not exist', async () => {
      const result: Response<QuestionnaireDto> = await chai
        .request(apiAddress)
        .get('/questionnaire/9999/9');

      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });
  });
});
