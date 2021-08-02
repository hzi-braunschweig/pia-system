/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* Hallo Programmer
 * This Class should provide to improve "question-proband"
 * All needed methods and functions will be saved here and
 * tested in tools.spec.ts
 * This is a provisional file. It should help to refactor
 * "question-proband"
 *
 * Please write only pure functions
 */

import { AbstractControl, FormControl, ValidationErrors } from '@angular/forms';
import { addDays, startOfToday } from 'date-fns';

export class Tools {
  public static getAnswerVersion(
    questionnaire_instance_status: string,
    answerVersionFromServer: number,
    release_version: number
  ): number | undefined {
    let version: number | undefined;
    switch (questionnaire_instance_status) {
      case 'active':
      case 'in_progress':
        version = answerVersionFromServer !== 0 ? answerVersionFromServer : 1;
        break;
      case 'released_once':
      case 'released':
        if (release_version === answerVersionFromServer) {
          version = answerVersionFromServer + 1;
        } else {
          version = answerVersionFromServer !== 0 ? answerVersionFromServer : 1;
        }
        break;
      default:
        break;
    }
    return version;
  }

  public static countDateFromToday(days: number): Date {
    return addDays(startOfToday(), days);
  }

  public static checkIfNumberIsDecimal(control: FormControl): ValidationErrors {
    const formControlText = control.value;
    if (
      formControlText &&
      formControlText.toString().match(/^-?(0|[1-9]\d*)([\.\,]\d+)?$/) === null
    ) {
      return { notDecimalNumber: true };
    } else {
      return null;
    }
  }

  public static checkIfNumberIsInteger(control: FormControl): ValidationErrors {
    const formControlText = control.value;
    if (
      formControlText &&
      formControlText.toString().match(/^([+-]?[1-9]\d*|0)$/) === null
    ) {
      return { notNumber: true };
    } else {
      return null;
    }
  }

  public static checkValueRanges(AC: AbstractControl): {
    valuesValidate: boolean;
  } {
    const formControlText = AC.get('value').value
      ? AC.get('answer_type_id').value === 3
        ? parseFloat(AC.get('value').value)
        : AC.get('value').value
      : null;
    const restriction_min = AC.get('restriction_min').value;
    const restriction_max = AC.get('restriction_max').value;

    if (
      formControlText === null ||
      formControlText === undefined ||
      formControlText === ''
    ) {
      return null;
    } else {
      if (
        !Number.isNaN(formControlText) &&
        !Number.isNaN(restriction_min) &&
        !Number.isNaN(restriction_max) &&
        restriction_min <= formControlText &&
        formControlText <= restriction_max
      ) {
        return null;
      } else {
        AC.get('value').setErrors({ valuesValidate: true });
        return { valuesValidate: true };
      }
    }
  }
}
