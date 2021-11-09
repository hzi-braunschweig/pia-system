/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireAnswerValidators } from './questionnaire-answer-validators';

describe('QuestionnaireAnswerValidators', () => {
  describe('isEmptyFormControlValue()', () => {
    it('should evaluate zero as not empty', () => {
      expect(
        QuestionnaireAnswerValidators.isEmptyFormControlValue(0)
      ).toBeFalse();
    });

    it('should evaluate NaN as empty', () => {
      expect(
        QuestionnaireAnswerValidators.isEmptyFormControlValue(NaN)
      ).toBeTrue();
    });

    it('should evaluate non empty strings as not empty', () => {
      expect(
        QuestionnaireAnswerValidators.isEmptyFormControlValue('abc')
      ).toBeFalse();
    });

    it('should evaluate empty strings as empty', () => {
      expect(
        QuestionnaireAnswerValidators.isEmptyFormControlValue('')
      ).toBeTrue();
    });

    it('should evaluate arrays with values as non empty', () => {
      expect(
        QuestionnaireAnswerValidators.isEmptyFormControlValue(['abc'])
      ).toBeFalse();
    });

    it('should evaluate empty arrays as empty', () => {
      expect(
        QuestionnaireAnswerValidators.isEmptyFormControlValue([])
      ).toBeTrue();
    });

    it('should evaluate SampleFormControlValues with values as non empty', () => {
      expect(
        QuestionnaireAnswerValidators.isEmptyFormControlValue({
          sampleId1: '1234',
          sampleId2: null,
        })
      ).toBeFalse();
    });

    it('should evaluate SampleFormControlValues without values as empty', () => {
      expect(
        QuestionnaireAnswerValidators.isEmptyFormControlValue({
          sampleId1: null,
          sampleId2: null,
        })
      ).toBeTrue();
    });
  });
});
