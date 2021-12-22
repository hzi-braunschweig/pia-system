/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export enum AnswerType {
  None = 0,
  SingleSelect = 1,
  MultiSelect = 2,
  Number = 3,
  Text = 4,
  Date = 5,
  Sample = 6,
  PZN = 7,
  Image = 8,
  Timestamp = 9,
  File = 10,
}

export interface AnswerOption {
  id: number;
  position: number;
  text: string | null;
  answerTypeId: AnswerType;
  isConditionTarget: boolean | null;
  isDecimal: boolean | null;
  isNotable: boolean[] | null;
  label: string | null;
  restrictionMax: number | null;
  restrictionMin: number | null;
  values: string[] | null;
  valuesCode: number[] | null;
}
