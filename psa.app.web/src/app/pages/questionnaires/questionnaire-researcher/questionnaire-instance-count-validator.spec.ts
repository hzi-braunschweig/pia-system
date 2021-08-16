/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { validateQuestionnaireInstanceCount } from './questionnaire-instance-count-validator';
import { FormControl, FormGroup } from '@angular/forms';

describe('validateQuestionnaireInstanceCount()', () => {
  const maxInstanceCount = 1500;
  const validate = validateQuestionnaireInstanceCount(maxInstanceCount);

  it('should return null if cycle_unit is empty', () => {
    // Arrange
    const formGroup = createFormGroup(1, undefined, 100);

    // Act
    const result = validate(formGroup);

    // Assert
    expect(result).toBeNull();
  });

  describe('cycle_unit = "hour"', () => {
    it('should return null if inputs are below threshold', () => {
      // Arrange
      const formGroup = createFormGroup(2, 'hour', 125);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toBeNull();
    });

    it('should return error if inputs are above threshold', () => {
      // Arrange
      const formGroup = createFormGroup(2, 'hour', 126);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toEqual({ questionnaireInstanceCount: true });
    });

    it('should handle empty cycle_amount input', () => {
      // Arrange
      const formGroup1 = createFormGroup(undefined, 'hour', 62);
      const formGroup2 = createFormGroup(undefined, 'hour', 63);

      // Act
      const result1 = validate(formGroup1);
      const result2 = validate(formGroup2);

      // Assert
      expect(result1).toBeNull();
      expect(result2).toEqual({ questionnaireInstanceCount: true });
    });

    it('should handle empty deactivate_after_days input', () => {
      // Arrange
      const formGroup = createFormGroup(1, 'hour', undefined);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('cycle_unit = "day"', () => {
    it('should return null if inputs are below threshold', () => {
      // Arrange
      const formGroup = createFormGroup(3, 'day', 4500);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toBeNull();
    });

    it('should return error if inputs are above threshold', () => {
      // Arrange
      const formGroup = createFormGroup(3, 'day', 4501);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toEqual({ questionnaireInstanceCount: true });
    });

    it('should handle empty cycle_amount input', () => {
      // Arrange
      const formGroup1 = createFormGroup(undefined, 'day', 1500);
      const formGroup2 = createFormGroup(undefined, 'day', 1501);

      // Act
      const result1 = validate(formGroup1);
      const result2 = validate(formGroup2);

      // Assert
      expect(result1).toBeNull();
      expect(result2).toEqual({ questionnaireInstanceCount: true });
    });

    it('should handle empty deactivate_after_days input', () => {
      // Arrange
      const formGroup = createFormGroup(1, 'day', undefined);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('cycle_unit = "week"', () => {
    it('should return null if inputs are below threshold', () => {
      // Arrange
      const formGroup = createFormGroup(2, 'week', 1500 * 7 * 2);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toBeNull();
    });

    it('should return error if inputs are above threshold', () => {
      // Arrange
      const formGroup = createFormGroup(2, 'week', 1500 * 7 * 2 + 1);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toEqual({ questionnaireInstanceCount: true });
    });

    it('should handle empty cycle_amount input', () => {
      // Arrange
      const formGroup1 = createFormGroup(undefined, 'week', 1500 * 7);
      const formGroup2 = createFormGroup(undefined, 'week', 1500 * 7 + 1);

      // Act
      const result1 = validate(formGroup1);
      const result2 = validate(formGroup2);

      // Assert
      expect(result1).toBeNull();
      expect(result2).toEqual({ questionnaireInstanceCount: true });
    });

    it('should handle empty deactivate_after_days input', () => {
      // Arrange
      const formGroup = createFormGroup(1, 'week', undefined);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('cycle_unit = "month"', () => {
    it('should return null if inputs are below threshold', () => {
      // Arrange
      const formGroup = createFormGroup(4, 'month', 1500 * 30 * 4);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toBeNull();
    });

    it('should return error if inputs are above threshold', () => {
      // Arrange
      const formGroup = createFormGroup(4, 'month', 1500 * 30 * 4 + 1);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toEqual({ questionnaireInstanceCount: true });
    });

    it('should handle empty cycle_amount input', () => {
      // Arrange
      const formGroup1 = createFormGroup(undefined, 'month', 1500 * 30);
      const formGroup2 = createFormGroup(undefined, 'month', 1500 * 30 + 1);

      // Act
      const result1 = validate(formGroup1);
      const result2 = validate(formGroup2);

      // Assert
      expect(result1).toBeNull();
      expect(result2).toEqual({ questionnaireInstanceCount: true });
    });

    it('should handle empty deactivate_after_days input', () => {
      // Arrange
      const formGroup = createFormGroup(1, 'month', undefined);

      // Act
      const result = validate(formGroup);

      // Assert
      expect(result).toBeNull();
    });
  });

  function createFormGroup(
    cylce_amount: number,
    cycle_unit: string,
    deactivate_after_days: number
  ): FormGroup {
    return new FormGroup({
      cycle_amount: new FormControl(cylce_amount),
      cycle_unit: new FormControl(cycle_unit),
      deactivate_after_days: new FormControl(deactivate_after_days),
    });
  }
});
