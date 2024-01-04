/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { TimeSpan, TimeSpanUnit } from '../model/timeSpan';
import { TimeRange } from '../model/timeRange';
import {
  AnswerData,
  QuestionnaireSettings,
  RelativeFrequencyTimeSeries,
} from './relativeFrequencyTimeSeries';
import { RelativeFrequencyTimeSeriesConfiguration } from '../entities/relativeFrequencyTimeSeriesConfiguration';

describe('RelativeFrequencyTimeSeries', () => {
  before(() => {
    process.env.TZ = 'Europe/Berlin';
  });

  it('should not accept non cyclic questionnaires', () => {
    // Arrange
    const questionnaire = createQuestionnaireSettings({
      cycleUnit: 'once',
    });

    // Act
    const constructor = (): RelativeFrequencyTimeSeries =>
      new RelativeFrequencyTimeSeries(
        createMockConfig({
          timeRange: new TimeRange(
            new Date('2022-06-01'),
            new Date('2022-06-03')
          ),
        }),
        questionnaire,
        questionnaire.createdAt
      );

    // Assert
    expect(constructor).to.throw(
      'Invalid cycle for relative frequency time series'
    );
  });

  it('should use the parameter firstQuestionnaireVersionCreatedAt instead of the createdAt from the questionnaire to determine the interval', () => {
    // Arrange
    const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
      createMockConfig({
        intervalShift: new TimeSpan(0, TimeSpanUnit.HOUR),
        timeRange: new TimeRange(
          new Date('2022-06-01'),
          new Date('2022-06-03')
        ),
      }),
      createQuestionnaireSettings({
        cycleUnit: 'hour',
        cycleAmount: 2,
        cycleFirstHour: 10,
        cyclePerDay: 1,
        createdAt: new Date('2022-06-02'),
      }),
      new Date('2022-06-01')
    );

    // Act
    // Assert
    const data = relativeFrequencyTimeSeries.getData();
    expect(data[0]?.intervals).to.have.lengthOf(3);
  });

  describe('hour interval', () => {
    it('should return relative frequencies for given time series', () => {
      // Arrange
      const answers: AnswerData[] = createAnswersForHourlyQuestionnaire();
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-1, TimeSpanUnit.HOUR),
          timeRange: new TimeRange(
            new Date('2022-06-01'),
            new Date('2022-06-03')
          ),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'hour',
          cycleAmount: 2,
          cycleFirstHour: 10,
          cyclePerDay: 3,
          createdAt: new Date('2022-05-31'),
        }),
        new Date('2022-05-31')
      );

      // Act
      answers.forEach((answer) =>
        relativeFrequencyTimeSeries.pushAnswer(answer)
      );

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      expect(data).to.have.lengthOf(1);
      expect(data[0]?.color).to.equal('#000000');
      expect(data[0]?.label).to.equal('My first series');

      expect(data[0]?.intervals).to.have.lengthOf(9);

      const interval1 = data[0]?.intervals.find((interval) =>
        interval.timeRange.isEqualTo(
          new TimeRange(
            new Date('2022-06-01T07:00:00.000Z'),
            new Date('2022-06-01T09:00:00.000Z')
          )
        )
      );
      expect(interval1).to.not.be.undefined;
      expect(interval1?.value).to.be.approximately(100, 3);

      const interval2 = data[0]?.intervals.find((interval) =>
        interval.timeRange.isEqualTo(
          new TimeRange(
            new Date('2022-06-01T11:00:00.000Z'),
            new Date('2022-06-01T13:00:00.000Z')
          )
        )
      );
      expect(interval2).to.not.be.undefined;
      expect(interval2?.value).to.be.approximately(50, 3);
    });

    it('should correctly assign answer at timeRange border to interval', () => {
      // Arrange
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-1, TimeSpanUnit.HOUR),
          timeRange: new TimeRange(
            new Date('2022-06-01'),
            new Date('2022-06-03')
          ),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'hour',
          cycleAmount: 2,
          cycleFirstHour: 10,
          cyclePerDay: 3,
          createdAt: new Date('2022-05-31'),
        }),
        new Date('2022-05-31')
      );

      // Act
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2022-06-01T08:00:00.000Z'),
        answerOptionId: 1810,
        valueCodes: [1],
      });
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2022-06-03T12:00:00.000Z'),
        answerOptionId: 1810,
        valueCodes: [1],
      });

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      expect(data).to.have.lengthOf(1);
      expect(data[0]?.intervals).to.have.lengthOf(9);

      expect(data[0]?.intervals[0]?.timeRange.toISOString()).to.equal(
        new TimeRange(
          new Date('2022-06-01T07:00:00.000Z'),
          new Date('2022-06-01T09:00:00.000Z')
        ).toISOString()
      );
      expect(data[0]?.intervals[0]?.value).to.be.approximately(100, 3);

      expect(data[0]?.intervals[4]?.timeRange.toISOString()).to.equal(
        new TimeRange(
          new Date('2022-06-02T09:00:00.000Z'),
          new Date('2022-06-02T11:00:00.000Z')
        ).toISOString()
      );
      expect(data[0]?.intervals[4]?.value).to.equal(0);

      expect(data[0]?.intervals[8]?.timeRange.toISOString()).to.equal(
        new TimeRange(
          new Date('2022-06-03T11:00:00.000Z'),
          new Date('2022-06-03T13:00:00.000Z')
        ).toISOString()
      );
      expect(data[0]?.intervals[8]?.value).to.be.approximately(100, 3);
    });

    it('should not add a time range if dateOfIssue does not fit to timeRange', () => {
      // Arrange
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-1, TimeSpanUnit.HOUR),
          timeRange: new TimeRange(
            new Date('2022-06-01'),
            new Date('2022-06-03')
          ),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'hour',
          cycleAmount: 2,
          cycleFirstHour: 10,
          cyclePerDay: 3,
          createdAt: new Date('2022-05-31'),
        }),
        new Date('2022-05-31')
      );

      // Act
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2022-06-02T20:00:00.000Z'),
        answerOptionId: 1810,
        valueCodes: [1],
      });
      // Assert
      relativeFrequencyTimeSeries
        .getData()[0]
        ?.intervals.forEach((interval) => {
          expect(interval.value).to.be.approximately(0, 3);
        });
    });

    it('should never return values lower than 0 and larger than 100', () => {
      // Arrange
      const answers: AnswerData[] = createAnswersForHourlyQuestionnaire();
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-1, TimeSpanUnit.HOUR),
          timeRange: new TimeRange(
            new Date('2022-06-01'),
            new Date('2022-06-03')
          ),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'hour',
          cycleAmount: 2,
          cycleFirstHour: 10,
          cyclePerDay: 3,
          createdAt: new Date('2022-05-31'),
        }),
        new Date('2022-05-31')
      );

      // Act
      answers.forEach((answer) =>
        relativeFrequencyTimeSeries.pushAnswer(answer)
      );

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      data.forEach((series, dataIndex) => {
        series.intervals.forEach((interval, intervalIndex) => {
          expect(
            interval.value,
            `data[${dataIndex}].interval[${intervalIndex}]`
          ).to.be.greaterThanOrEqual(0);
          expect(
            interval.value,
            `data[${dataIndex}].interval[${intervalIndex}]`
          ).to.be.lessThanOrEqual(100);
        });
      });
    });
  });

  describe('day interval', () => {
    it('should return relative frequencies for given time series', () => {
      // Arrange
      const answers: AnswerData[] = createAnswers();
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-7, TimeSpanUnit.DAY),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'day',
          createdAt: new Date('2022-12-01'),
        }),
        new Date('2022-12-01')
      );

      // Act
      answers.forEach((answer) =>
        relativeFrequencyTimeSeries.pushAnswer(answer)
      );

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      expect(data).to.have.lengthOf(1);
      expect(data[0]?.color).to.equal('#000000');
      expect(data[0]?.label).to.equal('My first series');

      expect(data[0]?.intervals).to.have.lengthOf(43);
      const interval1 = data[0]?.intervals.find((interval) =>
        interval.timeRange.isEqualTo(
          new TimeRange(
            new Date('2022-12-24T07:00:00.000Z'),
            new Date('2022-12-25T07:00:00.000Z')
          )
        )
      );
      expect(interval1).to.not.be.undefined;
      expect(interval1?.value).to.equal(0);

      const interval2 = data[0]?.intervals.find((interval) =>
        interval.timeRange.isEqualTo(
          new TimeRange(
            new Date('2022-12-31T07:00:00.000Z'),
            new Date('2023-01-01T07:00:00.000Z')
          )
        )
      );
      expect(interval2).to.not.be.undefined;
      expect(interval2?.value).to.be.approximately(67, 3);
    });

    it('should correctly assign answer at timeRange border to interval', () => {
      // Arrange
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-3, TimeSpanUnit.DAY),
          timeRange: new TimeRange(
            new Date('2022-12-03'),
            new Date('2022-12-17')
          ),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'day',
          createdAt: new Date('2022-12-01'),
        }),
        new Date('2022-12-01')
      );

      // Act
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2022-12-06T07:00:00.000Z'),
        answerOptionId: 1810,
        valueCodes: [1],
      });
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2022-12-19T07:00:00.000Z'),
        answerOptionId: 1810,
        valueCodes: [1],
      });

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      expect(data).to.have.lengthOf(1);
      expect(data[0]?.intervals).to.have.lengthOf(14);

      expect(data[0]?.intervals[0]?.timeRange.toISOString()).to.equal(
        new TimeRange(
          new Date('2022-12-03T07:00:00.000Z'),
          new Date('2022-12-04T07:00:00.000Z')
        ).toISOString()
      );
      expect(data[0]?.intervals[0]?.value).to.be.approximately(100, 3);

      expect(data[0]?.intervals[5]?.timeRange.toISOString()).to.equal(
        new TimeRange(
          new Date('2022-12-08T07:00:00.000Z'),
          new Date('2022-12-09T07:00:00.000Z')
        ).toISOString()
      );
      expect(data[0]?.intervals[5]?.value).to.equal(0);

      expect(data[0]?.intervals[13]?.timeRange.toISOString()).to.equal(
        new TimeRange(
          new Date('2022-12-16T07:00:00.000Z'),
          new Date('2022-12-17T07:00:00.000Z')
        ).toISOString()
      );
      expect(data[0]?.intervals[13]?.value).to.be.approximately(100, 3);
    });

    it('should not add a time range if dateOfIssue does not fit to timeRange', () => {
      // Arrange
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-7, TimeSpanUnit.DAY),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'day',
          createdAt: new Date('2022-12-01'),
        }),
        new Date('2022-12-01')
      );

      // Act
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2022-12-05'),
        answerOptionId: 1,
        valueCodes: [1],
      });
      // Assert
      relativeFrequencyTimeSeries
        .getData()[0]
        ?.intervals.forEach((interval) => {
          expect(interval.value).to.be.approximately(0, 3);
        });
    });

    it('should never return values lower than 0 and larger than 100', () => {
      // Arrange
      const answers: AnswerData[] = createAnswers();
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-7, TimeSpanUnit.DAY),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'day',
          createdAt: new Date('2022-12-01'),
        }),
        new Date('2022-12-01')
      );

      // Act
      answers.forEach((answer) =>
        relativeFrequencyTimeSeries.pushAnswer(answer)
      );

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      data.forEach((series, dataIndex) => {
        series.intervals.forEach((interval, intervalIndex) => {
          expect(
            interval.value,
            `data[${dataIndex}].interval[${intervalIndex}]`
          ).to.be.greaterThanOrEqual(0);
          expect(
            interval.value,
            `data[${dataIndex}].interval[${intervalIndex}]`
          ).to.be.lessThanOrEqual(100);
        });
      });
    });
  });

  describe('week interval', () => {
    it('should return relative frequencies for given time series', () => {
      // Arrange
      const answers: AnswerData[] = createAnswers();
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig(),
        createQuestionnaireSettings(),
        createQuestionnaireSettings().createdAt
      );

      // Act
      answers.forEach((answer) =>
        relativeFrequencyTimeSeries.pushAnswer(answer)
      );

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      expect(data).to.have.lengthOf(1);
      expect(data[0]?.color).to.equal('#000000');
      expect(data[0]?.label).to.equal('My first series');

      const interval1 = data[0]?.intervals.find((interval) =>
        interval.timeRange.isEqualTo(
          new TimeRange(
            new Date('2022-12-31T07:00:00.000Z'),
            new Date('2023-01-07T07:00:00.000Z')
          )
        )
      );
      expect(interval1).to.not.be.undefined;
      expect(interval1?.value).to.be.approximately(67, 3);

      const interval2 = data[0]?.intervals.find((interval) =>
        interval.timeRange.isEqualTo(
          new TimeRange(
            new Date('2023-01-07T07:00:00.000Z'),
            new Date('2023-01-14T07:00:00.000Z')
          )
        )
      );
      expect(interval2).to.not.be.undefined;
      expect(interval2?.value).to.be.approximately(33, 3);
    });

    it('should correctly assign answer at timeRange border to interval', () => {
      // Arrange
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          timeRange: new TimeRange(
            new Date('2022-12-03'),
            new Date('2022-12-17')
          ),
        }),
        createQuestionnaireSettings(),
        createQuestionnaireSettings().createdAt
      );

      // Act
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2022-12-10T07:00:00.000Z'),
        answerOptionId: 1810,
        valueCodes: [1],
      });
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2022-12-17T07:00:00.000Z'),
        answerOptionId: 1810,
        valueCodes: [1],
      });

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      expect(data).to.have.lengthOf(1);
      expect(data[0]?.intervals).to.have.lengthOf(2);

      expect(data[0]?.intervals[0]?.timeRange.toISOString()).to.equal(
        new TimeRange(
          new Date('2022-12-03T07:00:00.000Z'),
          new Date('2022-12-10T07:00:00.000Z')
        ).toISOString()
      );
      expect(data[0]?.intervals[0]?.value).to.be.approximately(100, 3);

      expect(data[0]?.intervals[1]?.timeRange.toISOString()).to.equal(
        new TimeRange(
          new Date('2022-12-10T07:00:00.000Z'),
          new Date('2022-12-17T07:00:00.000Z')
        ).toISOString()
      );
      expect(data[0]?.intervals[1]?.value).to.be.approximately(100, 3);
    });

    it('should not add a time range if dateOfIssue does not fit to timeRange', () => {
      // Arrange
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig(),
        createQuestionnaireSettings(),
        createQuestionnaireSettings().createdAt
      );

      // Act
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2022-12-05'),
        answerOptionId: 1810,
        valueCodes: [1],
      });
      // Assert
      relativeFrequencyTimeSeries
        .getData()[0]
        ?.intervals.forEach((interval) => {
          expect(interval.value).to.be.approximately(0, 3);
        });
    });

    it('should never return values lower than 0 and larger than 100', () => {
      // Arrange
      const answers: AnswerData[] = createAnswers();
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig(),
        createQuestionnaireSettings(),
        createQuestionnaireSettings().createdAt
      );

      // Act
      answers.forEach((answer) =>
        relativeFrequencyTimeSeries.pushAnswer(answer)
      );

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      data.forEach((series, dataIndex) => {
        series.intervals.forEach((interval, intervalIndex) => {
          expect(
            interval.value,
            `data[${dataIndex}].interval[${intervalIndex}]`
          ).to.be.greaterThanOrEqual(0);
          expect(
            interval.value,
            `data[${dataIndex}].interval[${intervalIndex}]`
          ).to.be.lessThanOrEqual(100);
        });
      });
    });
  });

  describe('month interval', () => {
    it('should return relative frequencies for given time series', () => {
      // Arrange
      const answers: AnswerData[] = createAnswersForMonthlyQuestionnaire();
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-1, TimeSpanUnit.MONTH),
          timeRange: new TimeRange(
            new Date('2022-01-01'),
            new Date('2022-12-01')
          ),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'month',
          createdAt: new Date('2022-01-01'),
        }),
        new Date('2022-01-01')
      );

      // Act
      answers.forEach((answer) =>
        relativeFrequencyTimeSeries.pushAnswer(answer)
      );

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      expect(data).to.have.lengthOf(1);
      expect(data[0]?.color).to.equal('#000000');
      expect(data[0]?.label).to.equal('My first series');

      expect(data[0]?.intervals).to.have.lengthOf(11);
      const interval1 = data[0]?.intervals.find((interval) =>
        interval.timeRange.isEqualTo(
          new TimeRange(
            new Date('2022-01-01T07:00:00.000Z'),
            new Date('2022-02-01T07:00:00.000Z')
          )
        )
      );
      expect(interval1).to.not.be.undefined;
      expect(interval1?.value).to.be.approximately(100, 3);

      const interval2 = data[0]?.intervals.find((interval) =>
        interval.timeRange.isEqualTo(
          new TimeRange(
            new Date('2022-04-01T06:00:00.000Z'),
            new Date('2022-05-01T06:00:00.000Z')
          )
        )
      );
      expect(interval2).to.not.be.undefined;
      expect(interval2?.value).to.be.approximately(33, 3);
    });

    it('should correctly assign answer at timeRange border to interval', () => {
      // Arrange
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-1, TimeSpanUnit.MONTH),
          timeRange: new TimeRange(
            new Date('2022-01-01'),
            new Date('2022-12-31')
          ),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'month',
          createdAt: new Date('2022-01-01'),
        }),
        new Date('2022-01-01')
      );

      // Act
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2022-02-01T07:00:00.000Z'),
        answerOptionId: 1810,
        valueCodes: [1],
      });
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2022-12-01T07:00:00.000Z'),
        answerOptionId: 1810,
        valueCodes: [1],
      });

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      expect(data).to.have.lengthOf(1);
      expect(data[0]?.intervals).to.have.lengthOf(11);

      expect(data[0]?.intervals[0]?.timeRange.toISOString()).to.equal(
        new TimeRange(
          new Date('2022-01-01T07:00:00.000Z'),
          new Date('2022-02-01T07:00:00.000Z')
        ).toISOString()
      );
      expect(data[0]?.intervals[0]?.value).to.be.approximately(100, 3);

      expect(data[0]?.intervals[10]?.timeRange.toISOString()).to.equal(
        new TimeRange(
          new Date('2022-11-01T07:00:00.000Z'),
          new Date('2022-12-01T07:00:00.000Z')
        ).toISOString()
      );
      expect(data[0]?.intervals[10]?.value).to.be.approximately(100, 3);
    });

    it('should not add a time range if dateOfIssue does not fit to timeRange', () => {
      // Arrange
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-1, TimeSpanUnit.MONTH),
          timeRange: new TimeRange(
            new Date('2022-01-01'),
            new Date('2022-12-01')
          ),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'month',
          createdAt: new Date('2022-01-01'),
        }),
        new Date('2022-01-01')
      );

      // Act
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2023-01-01T07:00:00.000Z'),
        answerOptionId: 1810,
        valueCodes: [1],
      });
      // Assert
      relativeFrequencyTimeSeries
        .getData()[0]
        ?.intervals.forEach((interval) => {
          expect(interval.value).to.be.approximately(0, 3);
        });
    });

    it('should never return values lower than 0 and larger than 100', () => {
      // Arrange
      const answers: AnswerData[] = createAnswersForMonthlyQuestionnaire();
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig({
          intervalShift: new TimeSpan(-1, TimeSpanUnit.MONTH),
          timeRange: new TimeRange(
            new Date('2022-01-01'),
            new Date('2022-12-01')
          ),
        }),
        createQuestionnaireSettings({
          cycleUnit: 'month',
          createdAt: new Date('2022-01-01'),
        }),
        new Date('2022-01-01')
      );

      // Act
      answers.forEach((answer) =>
        relativeFrequencyTimeSeries.pushAnswer(answer)
      );

      // Assert
      const data = relativeFrequencyTimeSeries.getData();
      data.forEach((series, dataIndex) => {
        series.intervals.forEach((interval, intervalIndex) => {
          expect(
            interval.value,
            `data[${dataIndex}].interval[${intervalIndex}]`
          ).to.be.greaterThanOrEqual(0);
          expect(
            interval.value,
            `data[${dataIndex}].interval[${intervalIndex}]`
          ).to.be.lessThanOrEqual(100);
        });
      });
    });
  });

  describe('isEmpty()', () => {
    it('should return true if all intervals contain zeros', () => {
      // Arrange
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig(),
        createQuestionnaireSettings(),
        createQuestionnaireSettings().createdAt
      );

      // Act
      const isEmpty = relativeFrequencyTimeSeries.isEmpty();

      // Assert
      expect(isEmpty).to.be.true;
    });

    it('should return false if at least one interval contains a non zero value', () => {
      // Arrange
      const relativeFrequencyTimeSeries = new RelativeFrequencyTimeSeries(
        createMockConfig(),
        createQuestionnaireSettings(),
        createQuestionnaireSettings().createdAt
      );
      relativeFrequencyTimeSeries.pushAnswer({
        questionnaireId: 5,
        questionnaireInstanceId: 1,
        questionnaireInstanceDateOfIssue: new Date('2023-01-07T07:00:00.000Z'),
        answerOptionId: 1810,
        valueCodes: [1, 2],
      });

      // Act
      const isEmpty = relativeFrequencyTimeSeries.isEmpty();

      // Assert
      expect(isEmpty).to.be.false;
    });
  });
});

export function createMockConfig(
  overwrites: Partial<RelativeFrequencyTimeSeriesConfiguration> = {}
): RelativeFrequencyTimeSeriesConfiguration {
  return {
    id: 1,
    study: 'Teststudy',
    comparativeValues: {
      questionnaire: {
        id: 5,
        version: 5,
      },
      answerOptionValueCodes: {
        id: 1810,
        variableName: 'ao1810',
        valueCodes: [1, 2],
      },
    },
    timeSeries: [
      {
        id: 1234,
        relativeFrequencyTimeSeriesConfigurationId: 1,
        study: 'Teststudy',
        color: '#000000',
        label: 'My first series',
        questionnaire: {
          id: 5,
          version: 5,
        },
        answerOptionValueCodes: {
          id: 1810,
          variableName: 'ao1810',
          valueCodes: [1],
        },
      },
    ],
    intervalShift: new TimeSpan(-1, TimeSpanUnit.WEEK),
    timeRange: new TimeRange(new Date('2022-12-03'), new Date('2023-01-15')),
    ...overwrites,
  };
}

function createQuestionnaireSettings(
  overwrites: Partial<QuestionnaireSettings> = {}
): QuestionnaireSettings {
  return {
    id: 1234,
    cycleAmount: 1,
    cycleUnit: 'week',
    cyclePerDay: null,
    cycleFirstHour: null,
    activateAfterDays: 0,
    deactivateAfterDays: 400,
    notificationWeekday: null,
    createdAt: new Date('2022-01-01'),
    ...overwrites,
  };
}

function createAnswers(): AnswerData[] {
  return [
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2023-01-07T07:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [1, 2],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2023-01-07T07:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [1],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2023-01-07T07:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [2],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2023-01-07T07:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [3],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2023-01-14T07:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [1],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2023-01-14T07:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [2, 3],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2023-01-14T07:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [2],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2023-01-14T07:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [3],
    },
  ];
}

function createAnswersForMonthlyQuestionnaire(): AnswerData[] {
  return [
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-02-01T07:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [1, 2],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-02-01T07:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [1],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-03-01T07:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [2],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-04-01T06:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [3],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-05-01T06:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [1],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-05-01T06:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [2, 3],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-05-01T06:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [2],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-06-01T06:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [3],
    },
  ];
}

function createAnswersForHourlyQuestionnaire(): AnswerData[] {
  return [
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-06-01T08:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [1, 2],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-06-01T08:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [1],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-06-01T10:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [2],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-06-01T10:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [3],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-06-01T12:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [2],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-06-01T12:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [1],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-06-02T08:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [2, 3],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-06-02T10:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [2],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-06-02T12:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [1],
    },
    {
      questionnaireId: 5,
      questionnaireInstanceId: 1,
      questionnaireInstanceDateOfIssue: new Date('2022-06-03T08:00:00.000Z'),
      answerOptionId: 1810,
      valueCodes: [3],
    },
  ];
}
