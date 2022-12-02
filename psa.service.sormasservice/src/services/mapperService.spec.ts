/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
import chai, { expect } from 'chai';
import { MapperService } from './mapperService';
import { Answer } from '../models/answer';
import { AnswerOption, AnswerType } from '../models/answerOption';
import {
  Bool3,
  CongenitalHeartDiseaseType,
  SymptomsDto,
  TemperatureSource,
} from '../models/symptomsDto';
import { createSandbox, SinonSpy } from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);
const firstLogArgOnFail =
  'Could not parse the answer for sormas. AnswerOption:';

describe('MapperService', () => {
  const testSandbox = createSandbox();
  let errorLogSpy: SinonSpy;

  beforeEach(() => {
    errorLogSpy = testSandbox.spy(console, 'error');
  });

  afterEach(() => {
    testSandbox.restore();
  });
  describe('mapPiaToSormas', () => {
    it('should map a string', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: 'Lorem ipsum dolor sit amet',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.Text,
            variableName: 'symptomsComments',
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {
        symptomsComments: 'Lorem ipsum dolor sit amet',
      };
      expect(symptoms).to.deep.equal(expected);
    });

    it('should map an integer but ignore wrong integer and log an error', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: '89',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.Number,
            variableName: 'weight',
          }),
        }),
        createAnswer({
          value: 'a189',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.Number,
            variableName: 'height',
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {
        weight: 89,
      };
      expect(symptoms).to.deep.equal(expected);
      expect(errorLogSpy).to.have.been.calledOnceWith(firstLogArgOnFail);
    });

    it('should map a float but ignore wrong float and log an error', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: 'a14159265359',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.Number,
            isDecimal: true,
            variableName: 'temperature',
          }),
        }),
        createAnswer({
          value: '36.14159265359',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.Number,
            isDecimal: true,
            variableName: 'temperature',
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {
        temperature: 36.14159265359,
      };
      expect(symptoms).to.deep.equal(expected);
      expect(errorLogSpy).to.have.been.calledOnceWith();
    });

    it('should map different date formats', () => {
      // Arrange
      const answers: Answer[] = [
        // This should work but will be overwritten by the next onsetDate
        createAnswer({
          value: '2021-09-07T15:17:57.328Z',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.Date,
            variableName: 'onsetDate',
          }),
        }),
        createAnswer({
          value: '1631085599717',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.Date,
            variableName: 'onsetDate',
          }),
        }),
        createAnswer({
          value:
            'Tue Sep 07 2021 17:18:34 GMT+0200 (Mitteleuropäische Sommerzeit)',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.Date,
            isDecimal: true,
            variableName: 'lesionsOnsetDate',
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      expect(symptoms.onsetDate?.getTime()).to.equal(
        new Date('2021-09-08T07:19:59.717Z').getTime()
      );
      expect(symptoms.lesionsOnsetDate?.getTime()).to.equal(
        new Date('2021-09-07T15:18:34.000Z').getTime()
      );
    });

    it('should map a boolean but ignore wrong boolean and log an error', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: 'No',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.SingleSelect,
            variableName: 'lesionsArms',
            values: ['Yes', 'No'],
            valuesCode: [1, 0],
          }),
        }),
        createAnswer({
          value: 'Yes',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.SingleSelect,
            variableName: 'lesionsFace',
            values: ['Yes', 'No'],
            valuesCode: [1, 0],
          }),
        }),
        createAnswer({
          value: 'Ye',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.SingleSelect,
            variableName: 'symptomatic',
            values: ['Yes', 'No'],
            valuesCode: [1, 0],
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {
        lesionsArms: false,
        lesionsFace: true,
      };
      expect(symptoms).to.deep.equal(expected);
      expect(errorLogSpy).to.have.been.calledOnceWith(firstLogArgOnFail);
    });

    it('should map a bool3 but ignore wrong bool3 and log an error', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: 'Yes',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.SingleSelect,
            variableName: 'backache',
            values: ['Yes', 'No', 'Maybe'],
            valuesCode: [1, 0, 2],
          }),
        }),
        createAnswer({
          value: 'No',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.SingleSelect,
            variableName: 'hiccups',
            values: ['Yes', 'No', 'Maybe'],
            valuesCode: [1, 0, 2],
          }),
        }),
        createAnswer({
          value: 'Maybe',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.SingleSelect,
            variableName: 'headache',
            values: ['Yes', 'No', 'Maybe'],
            valuesCode: [1, 0, 2],
          }),
        }),
        createAnswer({
          value: 'Unknown',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.SingleSelect,
            variableName: 'aerophobia',
            values: ['Yes', 'No', 'Maybe'],
            valuesCode: [1, 0, 2],
          }),
        }),
        createAnswer({
          value: 'Unknown',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.SingleSelect,
            variableName: 'musclePain',
            values: ['Yes', 'No', 'Maybe', 'Unknown'],
            valuesCode: [1, 0, 2, 3],
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {
        backache: Bool3.YES,
        hiccups: Bool3.NO,
        headache: Bool3.UNKNOWN,
      };
      expect(symptoms).to.deep.equal(expected);
      expect(errorLogSpy).to.have.been.calledWith(firstLogArgOnFail);
    });

    it('should map a temperatureSource', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: 'Oral',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.SingleSelect,
            variableName: 'temperatureSource',
            values: ['Infrared', 'Oral', 'Axillary', 'Rectal'],
            valuesCode: [1, 2, 3, 4],
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {
        temperatureSource: TemperatureSource.ORAL,
      };
      expect(symptoms).to.deep.equal(expected);
    });

    it('should map a congenitalHeartDiseaseType', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: 'PDA',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.SingleSelect,
            variableName: 'congenitalHeartDiseaseType',
            values: ['PDA', 'PPS', 'VSD', 'OTHER'],
            valuesCode: [1, 2, 3, 4],
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {
        congenitalHeartDiseaseType: CongenitalHeartDiseaseType.PDA,
      };
      expect(symptoms).to.deep.equal(expected);
    });

    it('should ignore empty answer arrays', () => {
      // Arrange
      const answers: Answer[] = [];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {};
      expect(symptoms).to.deep.equal(expected);
    });

    it('should ignore answers without a label', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: 'Lorem ipsum dolor sit amet',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.Text,
            variableName: '',
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {};
      expect(symptoms).to.deep.equal(expected);
    });

    it('should ignore answers with an unknown label', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: 'Lorem ipsum dolor sit amet',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.Text,
            variableName: 'unknown',
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {};
      expect(symptoms).to.deep.equal(expected);
    });

    it('should ignore answers without a value', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: '',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.Text,
            variableName: 'symptomsComments',
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {};
      expect(symptoms).to.deep.equal(expected);
    });

    it('should ignore wrong configured answer options with Bool3 but no SingleSelect', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: 'Yes',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.MultiSelect,
            variableName: 'backache',
            values: ['Yes', 'No', 'Maybe'],
            valuesCode: [1, 0, 2],
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {};
      expect(symptoms).to.deep.equal(expected);
    });

    it('should ignore wrong configured answer options with Bool3 but no values', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: 'Yes',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.SingleSelect,
            variableName: 'backache',
            values: null,
            valuesCode: [1, 0, 2],
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {};
      expect(symptoms).to.deep.equal(expected);
    });

    it('should ignore wrong configured answer options with Bool3 but valuesCodes', () => {
      // Arrange
      const answers: Answer[] = [
        createAnswer({
          value: 'Yes',
          answerOption: createAnswerOption({
            answerTypeId: AnswerType.MultiSelect,
            variableName: 'backache',
            values: ['Yes', 'No', 'Maybe'],
            valuesCode: null,
          }),
        }),
      ];

      // Act
      const symptoms = MapperService.mapPiaToSormas(answers);

      // Assert
      const expected: SymptomsDto = {};
      expect(symptoms).to.deep.equal(expected);
    });
  });
});

function createAnswerOption(
  overwrite: Partial<AnswerOption> = {}
): AnswerOption {
  return {
    answerTypeId: AnswerType.Text,
    id: 0,
    variableName: null,
    isConditionTarget: false,
    isDecimal: false,
    isNotable: null,
    position: 0,
    restrictionMax: null,
    restrictionMin: null,
    text: null,
    values: null,
    valuesCode: null,
    ...overwrite,
  };
}

function createAnswer(overwrite: Partial<Answer> = {}): Answer {
  return {
    answerOption: createAnswerOption(),
    dateOfRelease: null,
    releasingPerson: null,
    value: '',
    versioning: 1,
    ...overwrite,
  };
}
