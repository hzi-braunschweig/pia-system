/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  QuestionnaireStatus,
  QuestionnaireInstance,
} from '../questionnaire.model';

const sortOrderStatus = new Map<QuestionnaireStatus, number>([
  ['in_progress', 1],
  ['active', 2],
  ['released', 3],
  ['released_once', 3],
  ['released_twice', 3],
]);

export function compareQuestionnaireInstances(
  a: QuestionnaireInstance,
  b: QuestionnaireInstance
): number {
  return (
    // Sort by status priority
    sortOrderStatus.get(a.status) - sortOrderStatus.get(b.status) ||
    // Sort by sort order but null values last
    compareSortOrder(a.sort_order, b.sort_order) ||
    // Sort by date of issue
    new Date(b.date_of_issue).getTime() - new Date(a.date_of_issue).getTime()
  );
}

function compareSortOrder(a: number | null, b: number | null): number {
  const bothValuesAreEqual = a === b;
  const onlyAIsNull = a === null && b !== null;
  const onlyBIsNull = b === null && a !== null;

  if (bothValuesAreEqual) {
    return 0;
  } else if (onlyAIsNull) {
    return 1;
  } else if (onlyBIsNull) {
    return -1;
  } else {
    return a - b;
  }
}
