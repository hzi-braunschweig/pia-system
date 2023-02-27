/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export enum Missing {
  // answer is missing because the question was optional
  Unobtainable = '-9999',
  // answer is missing because the question or questionnaire was not shown due to a condition
  NotApplicable = '-8888',
  // answer is missing because the question was multiple choice and the option was not selected
  NoOrUnobtainable = '-7777',
  // answer is missing because the questionnaire was not released
  NotReleased = '-6666',
}

export function getMissingString(missing: number | Missing): string {
  switch (missing) {
    case Missing.NotApplicable:
      return 'notapplicable';
    case Missing.Unobtainable:
      return 'unobtainable';
    case Missing.NoOrUnobtainable:
      return 'no_or_unobtainable';
    case Missing.NotReleased:
      return 'notreleased';
    default:
      return '';
  }
}
