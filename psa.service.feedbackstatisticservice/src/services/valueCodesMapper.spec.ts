/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { ValueCodesMapper } from './valueCodesMapper';
import {
  AnswerOptionInternalDto,
  AnswerType,
  QuestionInternalDto,
} from '@pia-system/lib-http-clients-internal';

describe('ValueCodesMapper', () => {
  it('should map values to codes', () => {
    // Arrange
    const questions = [
      createQuestion({
        id: 10,
        position: 1,
        text: 'How do you feel?',
        answerOptions: [createAnswerOption({ variableName: 'var', id: 10 })],
      }),
      createQuestion({
        id: 20,
        position: 2,
        text: 'How do you feel now?',
        answerOptions: [createAnswerOption({ variableName: 'var', id: 20 })],
      }),
    ];
    const answerOptionId = 10;
    const valueCodesMapper = new ValueCodesMapper(questions);

    // Act
    const valueCodes = valueCodesMapper.map('var', answerOptionId, [
      'one',
      'three',
    ]);

    // Assert
    expect(valueCodes).to.deep.equal([1, 3]);
  });
});

function createQuestion(
  overwrite: Partial<QuestionInternalDto> = {}
): QuestionInternalDto {
  return {
    id: 9110,
    isMandatory: true,
    position: 1,
    text: 'How do you feel?',
    condition: null,
    answerOptions: [createAnswerOption()],
    ...overwrite,
  };
}

function createAnswerOption(
  overwrite: Partial<AnswerOptionInternalDto> = {}
): AnswerOptionInternalDto {
  return {
    id: 9111,
    position: 1,
    text: '',
    answerTypeId: AnswerType.SingleSelect,
    isConditionTarget: false,
    isDecimal: null,
    isNotable: [],
    variableName: '',
    restrictionMax: null,
    restrictionMin: null,
    values: ['one', 'two', 'three'],
    valuesCode: [1, 2, 3],
    ...overwrite,
  };
}
