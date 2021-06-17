import {
  AbstractControl,
  FormArray,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import { isValid } from 'date-fns';

import { QuestionnaireRestrictionDaysAsDatePipe } from '../questionnaire-detail/questionnaire-restriction-days-as-date.pipe';
import {
  FormControlValue,
  SampleFormControlValue,
} from './questionnaire-form.service';
import { Question } from '../questionnaire.model';
import { QuestionnaireConditionChecker } from '../questionnaire-condition-checker';

enum QuestionnaireAnswerValidationErrors {
  INVALID_INTEGER_ERROR = 'invalidIntegerError',
  DATE_MIN_MAX_ERROR = 'dateMinMaxError',
  WRONG_FORMAT_SAMPLE_ID_ERROR = 'sampleIdWrongFormat',
  SAMPLES_NOT_MATCH_ERROR = 'samplesNotMatch',
  REQUIRED_ERROR = 'required',
  DISALLOWED_FILE_SIZE = 'disallowedFileSize',
}

const maxFileSize = 20971520; // 20MB

export class QuestionnaireAnswerValidators {
  static Errors = QuestionnaireAnswerValidationErrors;

  static numberFormat(isDecimal: boolean): ValidatorFn {
    return (control: AbstractControl) => {
      if (control.value && !isDecimal && !Number.isInteger(control.value)) {
        return {
          [QuestionnaireAnswerValidationErrors.INVALID_INTEGER_ERROR]: true,
        };
      } else {
        return null;
      }
    };
  }

  static required(
    conditionChecker: QuestionnaireConditionChecker,
    question: Question
  ): ValidatorFn {
    if (!question.is_mandatory) {
      return () => null;
    }
    return (form: FormArray) => {
      const hasRequiredError =
        form.parent &&
        conditionChecker.isConditionMet(
          form.parent as FormArray,
          question.condition
        ) &&
        question.answer_options.some((answerOption, answerIndex) => {
          return (
            conditionChecker.isConditionMet(
              form.parent as FormArray,
              answerOption.condition
            ) && this.isEmptyFormControlValue(form.at(answerIndex).value)
          );
        });
      return hasRequiredError
        ? { [QuestionnaireAnswerValidationErrors.REQUIRED_ERROR]: true }
        : null;
    };
  }

  /**
   * Validates whether given date value is between boundaries
   *
   * @param min negative number of days relative to today
   * @param max positive number of days relative to today
   */
  static dateStringMinMax(min: number, max: number): ValidatorFn {
    if (!min || !max) {
      return () => null;
    }
    const restrictionDaysAsDate = new QuestionnaireRestrictionDaysAsDatePipe();

    return (control: AbstractControl) => {
      const inputDate: Date = control.value;
      const minDate = restrictionDaysAsDate.transform(min);
      const maxDate = restrictionDaysAsDate.transform(max);

      if (
        inputDate &&
        isValid(inputDate) &&
        (inputDate < minDate || inputDate > maxDate)
      ) {
        return {
          [QuestionnaireAnswerValidationErrors.DATE_MIN_MAX_ERROR]: true,
        };
      } else {
        return null;
      }
    };
  }

  static sampleId(
    samplePrefix: string,
    sampleSuffixLength: number
  ): ValidatorFn {
    const regexp = new RegExp(
      (samplePrefix ? '^' + samplePrefix + '-' : '.*') +
        (sampleSuffixLength ? '[0-9]{' + sampleSuffixLength + '}$' : '[0-9]*$'),
      'i'
    );

    return (control: AbstractControl) => {
      const inputValue: string = control.value;

      if (!inputValue || regexp.test(inputValue.toUpperCase())) {
        return null;
      }

      return {
        [QuestionnaireAnswerValidationErrors.WRONG_FORMAT_SAMPLE_ID_ERROR]:
          true,
      };
    };
  }

  static sampleMatch(
    samplePrefix: string,
    isDoubleCheckActive: boolean
  ): ValidatorFn {
    if (!isDoubleCheckActive) {
      return () => null;
    }

    const prefixCheckLocation =
      samplePrefix.length + 1 + (samplePrefix ? 1 : 0);

    return (control: FormGroup) => {
      const values: SampleFormControlValue = control.value;

      if (
        !values.sampleId1 ||
        !values.sampleId2 ||
        (values.sampleId1.charAt(prefixCheckLocation) === '0' &&
          values.sampleId2.charAt(prefixCheckLocation) === '1') ||
        (values.sampleId1.charAt(prefixCheckLocation) === '1' &&
          values.sampleId2.charAt(prefixCheckLocation) === '0')
      ) {
        return null;
      } else {
        return {
          [QuestionnaireAnswerValidationErrors.SAMPLES_NOT_MATCH_ERROR]: true,
        };
      }
    };
  }

  static isEmptyFormControlValue(value: FormControlValue): boolean {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return true;
    } else if (
      typeof value === 'object' &&
      'sampleId1' in value &&
      value.sampleId1 === null &&
      'sampleId2' in value &&
      value.sampleId2 === null
    ) {
      return true;
    }
    return false;
  }

  static isAllowedFileSize(): ValidatorFn {
    return (control: AbstractControl) => {
      if (control.value && JSON.stringify(control.value).length > maxFileSize) {
        return {
          [QuestionnaireAnswerValidationErrors.DISALLOWED_FILE_SIZE]: true,
        };
      } else {
        return null;
      }
    };
  }
}
