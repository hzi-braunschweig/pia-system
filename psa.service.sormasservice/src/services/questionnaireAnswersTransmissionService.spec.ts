/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import chai, { expect } from 'chai';
import sinon, { SinonStubbedInstance } from 'sinon';
import sinonChai from 'sinon-chai';

import { SinonMethodStub } from '@pia/lib-service-core';
import { MapperService } from './mapperService';
import { SormasClient } from '../clients/sormasClient';
import { userserviceClient } from '../clients/userserviceClient';
import { questionnaireserviceClient } from '../clients/questionnaireserviceClient';
import { ExpiredUsersDeletionService } from './expiredUsersDeletionService';
import { Connection, ConnectionManager, Repository } from 'typeorm';
import { SymptomTransmission } from '../entities/symptomTransmission';
import { createQuestionnaireInstance } from '../../tests/integration/instanceCreator.helper';
import { QuestionnaireAnswersTransmissionService } from './questionnaireAnswersTransmissionService';
import { QuestionnaireInstanceWithQuestionnaireInternalDto } from '@pia-system/lib-http-clients-internal';

chai.use(sinonChai);

describe('QuestionnaireAnswersTransmissionService', () => {
  const suiteSandbox = sinon.createSandbox();
  const testSandbox = sinon.createSandbox();

  let mapPiaToSormasStub: SinonMethodStub<typeof MapperService.mapPiaToSormas>;
  let uploadVisitStub: SinonMethodStub<typeof SormasClient.uploadVisit>;
  let lookupIdsStub: SinonMethodStub<typeof userserviceClient.lookupIds>;
  let getQuestionnaireInstanceStub: SinonMethodStub<
    typeof questionnaireserviceClient.getQuestionnaireInstance
  >;
  let getQuestionnaireInstanceAnswersStub: SinonMethodStub<
    typeof questionnaireserviceClient.getQuestionnaireInstanceAnswers
  >;
  let deleteProbandsIfEveryQIIsReleasedAndTransmittedStub: SinonMethodStub<
    typeof ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted
  >;

  let mockedDbConnection: SinonStubbedInstance<Connection>;
  let mockedTransmissionRepository: SinonStubbedInstance<
    Repository<SymptomTransmission>
  >;

  before(() => {
    mockedDbConnection = suiteSandbox.createStubInstance(Connection);
    suiteSandbox
      .stub(ConnectionManager.prototype)
      // @ts-ignore
      .get.returns(mockedDbConnection);
  });
  after(() => {
    suiteSandbox.restore();
  });

  beforeEach(() => {
    mapPiaToSormasStub = testSandbox.stub(MapperService, 'mapPiaToSormas');
    uploadVisitStub = testSandbox.stub(SormasClient, 'uploadVisit').resolves();
    lookupIdsStub = testSandbox.stub(userserviceClient, 'lookupIds');
    getQuestionnaireInstanceStub = testSandbox.stub(
      questionnaireserviceClient,
      'getQuestionnaireInstance'
    );
    getQuestionnaireInstanceAnswersStub = testSandbox.stub(
      questionnaireserviceClient,
      'getQuestionnaireInstanceAnswers'
    );
    deleteProbandsIfEveryQIIsReleasedAndTransmittedStub = testSandbox
      .stub(
        ExpiredUsersDeletionService,
        'deleteProbandsIfEveryQIIsReleasedAndTransmitted'
      )
      .resolves();

    // @ts-ignore
    mockedTransmissionRepository =
      // @ts-ignore
      testSandbox.createStubInstance<SymptomTransmission>(Repository);
    mockedDbConnection.getRepository.returns(
      mockedTransmissionRepository as unknown as Repository<SymptomTransmission>
    );
  });

  afterEach(() => {
    testSandbox.restore();
  });

  it('should not upload questionnaire answers if they were not yet released', async () => {
    // Arrange
    const qiId = 9100;
    const version = 0;

    // Act
    await QuestionnaireAnswersTransmissionService.onQuestionnaireInstanceReleased(
      qiId,
      version
    );

    // Assert
    expect(uploadVisitStub).to.have.not.been.called;
    expect(deleteProbandsIfEveryQIIsReleasedAndTransmittedStub).to.have.not.been
      .called;
  });

  it('should upload questionnaire answers if they were released once', async () => {
    // Arrange
    const qiId = 9100;
    const version = 1;
    mockedTransmissionRepository.count.resolves(0);
    getQuestionnaireInstanceStub.resolves(
      createQuestionnaireInstance({
        pseudonym: 'test-0123456789',
        status: 'released_once',
      }) as QuestionnaireInstanceWithQuestionnaireInternalDto
    );
    lookupIdsStub.resolves('test-uuid');
    mapPiaToSormasStub.returns({ symptomsComments: 'Lorem ipsum dolor.' });

    // Act
    await QuestionnaireAnswersTransmissionService.onQuestionnaireInstanceReleased(
      qiId,
      version
    );

    // Assert
    expect(lookupIdsStub).to.have.been.called;
    expect(getQuestionnaireInstanceStub).to.have.been.called;
    expect(getQuestionnaireInstanceAnswersStub).to.have.been.called;
    expect(mapPiaToSormasStub).to.have.been.called;
    expect(uploadVisitStub).to.have.been.called;
    expect(deleteProbandsIfEveryQIIsReleasedAndTransmittedStub).to.have.been
      .called;
  });

  it('should upload questionnaire answers if they were released twice', async () => {
    // Arrange
    const qiId = 9100;
    const version = 2;
    mockedTransmissionRepository.count.resolves(0);
    getQuestionnaireInstanceStub.resolves(
      createQuestionnaireInstance({
        pseudonym: 'test-0123456789',
        status: 'released_twice',
      }) as QuestionnaireInstanceWithQuestionnaireInternalDto
    );
    lookupIdsStub.resolves('test-uuid');
    mapPiaToSormasStub.returns({ symptomsComments: 'Lorem ipsum dolor.' });

    // Act
    await QuestionnaireAnswersTransmissionService.onQuestionnaireInstanceReleased(
      qiId,
      version
    );

    // Assert
    expect(lookupIdsStub).to.have.been.called;
    expect(getQuestionnaireInstanceStub).to.have.been.called;
    expect(getQuestionnaireInstanceAnswersStub).to.have.been.called;
    expect(mapPiaToSormasStub).to.have.been.called;
    expect(uploadVisitStub).to.have.been.called;
    expect(deleteProbandsIfEveryQIIsReleasedAndTransmittedStub).to.have.been
      .called;
  });

  it('should not upload questionnaire that has no relevant data', async () => {
    // Arrange
    const qiId = 9100;
    const version = 1;
    mockedTransmissionRepository.count.resolves(0);
    getQuestionnaireInstanceStub.resolves(
      createQuestionnaireInstance({
        pseudonym: 'test-0123456789',
        status: 'released_twice',
      }) as QuestionnaireInstanceWithQuestionnaireInternalDto
    );
    lookupIdsStub.resolves('test-uuid');
    mapPiaToSormasStub.returns({});

    // Act
    await QuestionnaireAnswersTransmissionService.onQuestionnaireInstanceReleased(
      qiId,
      version
    );

    // Assert
    expect(lookupIdsStub).to.have.been.called;
    expect(getQuestionnaireInstanceStub).to.have.been.called;
    expect(getQuestionnaireInstanceAnswersStub).to.have.been.called;
    expect(mapPiaToSormasStub).to.have.been.called;
    expect(deleteProbandsIfEveryQIIsReleasedAndTransmittedStub).to.have.been
      .called;

    expect(uploadVisitStub).to.not.have.been.called;
  });
});
