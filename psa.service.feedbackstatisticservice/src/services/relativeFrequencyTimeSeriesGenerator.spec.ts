/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import chai, { expect } from 'chai';
import sinon, { SinonStubbedInstance } from 'sinon';
import { Connection, ConnectionManager, Repository } from 'typeorm';
import {
  AnswerDataInternalDto,
  AnswerType,
  QuestionnaireInternalDto,
} from '@pia-system/lib-http-clients-internal';
import { relativeFrequencyTimeSeriesGenerator } from './relativeFrequencyTimeSeriesGenerator';
import { createMockConfig } from './relativeFrequencyTimeSeries.spec';
import { RelativeFrequencyTimeSeriesConfiguration } from '../entities/relativeFrequencyTimeSeriesConfiguration';
import { questionnaireserviceClient } from '../clients/questionnaireserviceClient';
import sinonChai from 'sinon-chai';
import { Readable } from 'stream';
import { TimeRange } from '../model/timeRange';
import { TimeSpan, TimeSpanUnit } from '../model/timeSpan';

chai.use(sinonChai);

describe('relativeFrequencyTimeSeriesGenerator', () => {
  const suiteSandbox = sinon.createSandbox();
  const testSandbox = sinon.createSandbox();

  let questionnaireStub: sinon.SinonStub;
  let questionnaireAnswersStub: sinon.SinonStub;
  let mockedDbConnection: SinonStubbedInstance<Connection>;
  let mockedTimeSeriesRepository: SinonStubbedInstance<
    Repository<RelativeFrequencyTimeSeriesConfiguration>
  >;

  before(() => {
    mockedDbConnection = suiteSandbox.createStubInstance(Connection);
    suiteSandbox
      .stub(ConnectionManager.prototype)
      .get.returns(mockedDbConnection);
  });

  beforeEach(() => {
    mockedTimeSeriesRepository =
      testSandbox.createStubInstance<RelativeFrequencyTimeSeriesConfiguration>(
        Repository as any
      ) as any;
    mockedDbConnection.getRepository.returns(
      mockedTimeSeriesRepository as unknown as Repository<any>
    );

    questionnaireStub = sinon.stub(
      questionnaireserviceClient,
      'getQuestionnaire'
    );
    questionnaireAnswersStub = sinon.stub(
      questionnaireserviceClient,
      'getQuestionnaireAnswers'
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  after(() => {
    suiteSandbox.restore();
  });

  it('should generate data', async () => {
    const mockConfig = createMockConfig({
      intervalShift: new TimeSpan(0, TimeSpanUnit.HOUR),
      timeRange: new TimeRange(new Date('2022-06-01'), new Date('2022-06-03')),
      comparativeValues: {
        questionnaire: {
          id: 1,
          version: 1,
        },
        answerOptionValueCodes: {
          id: 1810,
          variableName: 'ao1810',
          valueCodes: [1, 2],
        },
      },
    });
    const mockQuestionnaire = createQuestionnaireMock({ id: 1, version: 1 });

    mockedTimeSeriesRepository.findOneOrFail.resolves(mockConfig);

    questionnaireStub.resolves(mockQuestionnaire);
    questionnaireAnswersStub.resolves(
      new Readable({
        objectMode: true,
        read(): void {
          this.push(createAnswerDataMock({}));
          this.push(null);
        },
      })
    );

    const result = await relativeFrequencyTimeSeriesGenerator.generateData(3);

    expect(questionnaireStub.calledOnceWith(1, 1)).to.be.true;
    expect(result.length).to.be.equal(1);
    const intervalsWithValues = result[0]?.intervals.filter(
      (interval) => interval.value >= 97
    );
    expect(intervalsWithValues?.length).to.equal(1);
  });

  it('should query the first version of a questionnaire if the version is higher than 1 and use the createdAt of the first version', async () => {
    const mockConfig = createMockConfig({
      intervalShift: new TimeSpan(0, TimeSpanUnit.HOUR),
      timeRange: new TimeRange(new Date('2022-06-01'), new Date('2022-06-03')),
      comparativeValues: {
        questionnaire: {
          id: 3,
          version: 3,
        },
        answerOptionValueCodes: {
          id: 1810,
          variableName: 'ao1810',
          valueCodes: [1, 2],
        },
      },
    });
    const mockQuestionnaireVersion3 = createQuestionnaireMock({
      id: 3,
      version: 3,
      createdAt: new Date('2022-06-03'),
    });
    const mockQuestionnaireVersion1 = createQuestionnaireMock({
      id: 3,
      version: 1,
      createdAt: new Date('2022-06-01'),
    });

    mockedTimeSeriesRepository.findOneOrFail.resolves(mockConfig);

    questionnaireStub.onCall(0).resolves(mockQuestionnaireVersion3);
    questionnaireStub.onCall(1).resolves(mockQuestionnaireVersion1);
    questionnaireAnswersStub.resolves(
      new Readable({
        objectMode: true,
        read(): void {
          this.push(createAnswerDataMock({}));
          this.push(null);
        },
      })
    );

    const result = await relativeFrequencyTimeSeriesGenerator.generateData(3);

    expect(questionnaireStub.calledTwice).to.be.true;
    expect(questionnaireStub.calledWith(3, 3)).to.be.true;
    expect(questionnaireStub.calledWith(3, 1)).to.be.true;

    expect(result.length).to.be.equal(1);
    expect(result[0]?.intervals.length).to.equal(9);
  });
});

function createQuestionnaireMock(
  overwrite: Partial<QuestionnaireInternalDto>
): QuestionnaireInternalDto {
  return {
    id: 1,
    version: 1,
    studyId: 'study-id',
    name: 'Test',
    noQuestions: 1,
    cycleAmount: 1,
    cycleUnit: 'hour',
    activateAfterDays: 0,
    deactivateAfterDays: 2,
    notificationTries: 1,
    notificationTitle: 'Test',
    notificationBodyNew: 'Test',
    notificationBodyInProgress: 'Test',
    notificationWeekday: null,
    notificationInterval: null,
    notificationIntervalUnit: null,
    activateAtDate: null,
    complianceNeeded: true,
    expiresAfterDays: 2,
    finalisesAfterDays: 0,
    type: 'for_probands',
    publish: 'Test',
    notifyWhenNotFilled: null,
    notifyWhenNotFilledTime: null,
    notifyWhenNotFilledDay: null,
    cyclePerDay: 3,
    cycleFirstHour: 8,
    keepAnswers: true,
    active: true,
    createdAt: new Date('2022-06-01'),
    updatedAt: new Date('2022-06-01'),
    questions: [
      {
        id: 1810,
        isMandatory: null,
        position: 1,
        text: 'test',
        condition: null,
        answerOptions: [
          {
            id: 1,
            position: 1,
            text: 'Test',
            answerTypeId: AnswerType.SingleSelect,
            isConditionTarget: true,
            isDecimal: false,
            isNotable: [true, false],
            variableName: 'exampleVariable',
            restrictionMax: 100,
            restrictionMin: 1,
            values: ['value1', 'value2'],
            valuesCode: [1, 2],
          },
        ],
      },
    ],
    condition: null,
    ...overwrite,
  };
}
function createAnswerDataMock(
  overwrite: Partial<AnswerDataInternalDto>
): AnswerDataInternalDto {
  return {
    questionnaireId: 1,
    questionnaireInstanceId: 1,
    questionnaireInstanceDateOfIssue: new Date(
      '2022-06-02T08:00:00.000Z'
    ).toISOString(),
    answerOptionId: 1810,
    answerOptionVariableName: 'exampleVariable',
    values: ['value1'],
    ...overwrite,
  };
}
