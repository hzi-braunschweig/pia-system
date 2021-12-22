/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Bool3,
  CongenitalHeartDiseaseType,
  isSymptomBool3Key,
  isSymptomBooleanKey,
  isSymptomCongenitalHeartDiseaseTypeKey,
  isSymptomDateKey,
  isSymptomFloatKey,
  isSymptomIntegerKey,
  isSymptomStringKey,
  isSymptomTemperatureSourceKey,
  SymptomsDto,
  TemperatureSource,
} from '../models/symptomsDto';
import { Answer } from '../models/answer';
import { AnswerOption, AnswerType } from '../models/answerOption';

//=== Customizable settings to define the mapping =================================

enum BooleanCode {
  FALSE = 0,
  TRUE = 1,
}
enum Bool3Code {
  NO = 0,
  YES = 1,
  UNKNOWN = 2,
}
enum TemperatureSourceCode {
  NON_CONTACT_0 = 0,
  NON_CONTACT = 1,
  ORAL = 2,
  AXILLARY = 3,
  RECTAL = 4,
}
enum CongenitalHeartDiseaseTypeCode {
  PDA = 1,
  PPS = 2,
  VSD = 3,
  OTHER = 4,
}

const booleanCodeMap = new Map<BooleanCode, boolean>([
  [BooleanCode.FALSE, false],
  [BooleanCode.TRUE, true],
]);
const bool3CodeMap = new Map<Bool3Code, Bool3>([
  [Bool3Code.NO, Bool3.NO],
  [Bool3Code.YES, Bool3.YES],
  [Bool3Code.UNKNOWN, Bool3.UNKNOWN],
]);
const temperatureSourceCodeMap = new Map<
  TemperatureSourceCode,
  TemperatureSource
>([
  [TemperatureSourceCode.NON_CONTACT_0, TemperatureSource.NON_CONTACT],
  [TemperatureSourceCode.NON_CONTACT, TemperatureSource.NON_CONTACT],
  [TemperatureSourceCode.ORAL, TemperatureSource.ORAL],
  [TemperatureSourceCode.AXILLARY, TemperatureSource.AXILLARY],
  [TemperatureSourceCode.RECTAL, TemperatureSource.RECTAL],
]);
const congenitalHeartDiseaseTypeCodeMap = new Map<
  CongenitalHeartDiseaseTypeCode,
  CongenitalHeartDiseaseType
>([
  [CongenitalHeartDiseaseTypeCode.PDA, CongenitalHeartDiseaseType.PDA],
  [CongenitalHeartDiseaseTypeCode.PPS, CongenitalHeartDiseaseType.PPS],
  [CongenitalHeartDiseaseTypeCode.VSD, CongenitalHeartDiseaseType.VSD],
  [CongenitalHeartDiseaseTypeCode.OTHER, CongenitalHeartDiseaseType.OTHER],
]);

//=================================================================================

export class MapperService {
  public static mapPiaToSormas(answers: Answer[]): SymptomsDto {
    const sormasAnswers: SymptomsDto = {};

    for (const answer of answers) {
      if (!answer.answerOption.label) {
        continue;
      }
      if (!answer.value) {
        continue;
      }
      try {
        if (isSymptomStringKey(answer.answerOption.label)) {
          sormasAnswers[answer.answerOption.label] = this.convertString(
            answer.value
          );
        } else if (isSymptomIntegerKey(answer.answerOption.label)) {
          sormasAnswers[answer.answerOption.label] = this.convertInteger(
            answer.value
          );
        } else if (isSymptomFloatKey(answer.answerOption.label)) {
          sormasAnswers[answer.answerOption.label] = this.convertFloat(
            answer.value
          );
        } else if (isSymptomBooleanKey(answer.answerOption.label)) {
          sormasAnswers[answer.answerOption.label] = this.convertBoolean(
            answer.value,
            answer.answerOption
          );
        } else if (isSymptomDateKey(answer.answerOption.label)) {
          sormasAnswers[answer.answerOption.label] = this.convertDate(
            answer.value
          );
        } else if (isSymptomBool3Key(answer.answerOption.label)) {
          sormasAnswers[answer.answerOption.label] = this.convertBool3(
            answer.value,
            answer.answerOption
          );
        } else if (isSymptomTemperatureSourceKey(answer.answerOption.label)) {
          sormasAnswers[answer.answerOption.label] =
            this.convertTemperatureSource(answer.value, answer.answerOption);
        } else if (
          isSymptomCongenitalHeartDiseaseTypeKey(answer.answerOption.label)
        ) {
          sormasAnswers[answer.answerOption.label] =
            this.convertCongenitalHeartDiseaseType(
              answer.value,
              answer.answerOption
            );
        }
      } catch (e) {
        console.error(
          'Could not parse the answer for sormas. AnswerOption:',
          answer.answerOption,
          'Answer.value:',
          answer.value,
          e
        );
      }
    }
    return sormasAnswers;
  }

  private static convertString(value: string): string {
    return value;
  }

  private static convertInteger(value: string): number {
    const convertedValue = parseInt(value, 10);
    if (!isNaN(convertedValue)) return convertedValue;
    throw new Error('Could not parse to integer.');
  }

  private static convertFloat(value: string): number {
    const convertedValue = parseFloat(value);
    if (!isNaN(convertedValue)) return convertedValue;
    throw new Error('Could not parse to float.');
  }

  private static convertDate(value: string): Date {
    let date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
    date = new Date(parseInt(value, 10));
    if (!isNaN(date.getTime())) {
      return date;
    }
    throw new Error('Could not parse to date.');
  }

  private static convertBoolean(
    value: string,
    answerOption: AnswerOption
  ): boolean {
    const valueCode = this.getValueCodeOfSelectSingleAnswer(
      value,
      answerOption
    );
    const convertedValue = booleanCodeMap.get(valueCode);
    if (convertedValue === undefined) {
      throw new Error('Unknown value code for boolean type.');
    }
    return convertedValue;
  }

  private static convertBool3(
    value: string,
    answerOption: AnswerOption
  ): Bool3 {
    const valueCode = this.getValueCodeOfSelectSingleAnswer(
      value,
      answerOption
    );
    const convertedValue = bool3CodeMap.get(valueCode);
    if (convertedValue === undefined) {
      throw new Error('Unknown value code for Bool3 type.');
    }
    return convertedValue;
  }

  private static convertTemperatureSource(
    value: string,
    answerOption: AnswerOption
  ): TemperatureSource {
    const valueCode = this.getValueCodeOfSelectSingleAnswer(
      value,
      answerOption
    );
    const convertedValue = temperatureSourceCodeMap.get(valueCode);
    if (convertedValue === undefined) {
      throw new Error('Unknown value code for TemperatureSource type.');
    }
    return convertedValue;
  }

  private static convertCongenitalHeartDiseaseType(
    value: string,
    answerOption: AnswerOption
  ): CongenitalHeartDiseaseType {
    const valueCode = this.getValueCodeOfSelectSingleAnswer(
      value,
      answerOption
    );
    const convertedValue = congenitalHeartDiseaseTypeCodeMap.get(valueCode);
    if (convertedValue === undefined) {
      throw new Error(
        'Unknown value code for CongenitalHeartDiseaseType type.'
      );
    }
    return convertedValue;
  }

  private static getValueCodeOfSelectSingleAnswer(
    value: string,
    answerOption: AnswerOption
  ): number {
    // Assert
    if (answerOption.answerTypeId !== AnswerType.SingleSelect) {
      throw new Error('Cannot handle other answer types than single select.');
    }
    if (!answerOption.values) {
      throw new Error(
        'Answer option with type single select is missing values.'
      );
    }
    if (!answerOption.valuesCode) {
      throw new Error(
        'Answer option with type single select is missing value codes.'
      );
    }
    const index = answerOption.values.indexOf(value);
    if (index === -1) {
      throw new Error('Answer could not be found in answer option values.');
    }
    // eslint-disable-next-line security/detect-object-injection
    const valueCode = answerOption.valuesCode[index];
    if (valueCode === undefined) {
      throw new Error(
        'Answer could not be found in answer option value codes.'
      );
    }
    return valueCode;
  }
}
