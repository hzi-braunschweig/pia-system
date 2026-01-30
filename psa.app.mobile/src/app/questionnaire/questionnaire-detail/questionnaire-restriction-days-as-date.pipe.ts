/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts a restriction in days value into a date. The restriction is relative to
 * the current date.
 *
 * Strictly the pipe is not pure, because every call might result in a new date based
 * on the return value of `new Date()`. But for performance reasons this pipe is
 * declared as pure, thus, the result of it will be cached by Angular.
 */
@Pipe({
  name: 'restrictionDaysAsDate',
  pure: true,
})
export class QuestionnaireRestrictionDaysAsDatePipe implements PipeTransform {
  transform(restrictionInDays: number): Date | null {
    if (restrictionInDays === null || restrictionInDays === undefined) {
      return null;
    }
    const shiftedDate = new Date();
    shiftedDate.setDate(shiftedDate.getDate() + restrictionInDays);
    return shiftedDate;
  }
}
