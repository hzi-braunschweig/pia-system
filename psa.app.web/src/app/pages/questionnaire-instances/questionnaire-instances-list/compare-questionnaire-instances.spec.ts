/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mock } from 'ts-mockito';
import {
  QuestionnaireInstance,
  QuestionnaireStatus,
} from '../../../psa.app.core/models/questionnaireInstance';
import { compareQuestionnaireInstances } from './compare-questionnaire-instances';
import { CycleUnit } from '../../../psa.app.core/models/questionnaire';

describe('compareQuestionnaireInstances', () => {
  describe('status', () => {
    const testCases: [QuestionnaireStatus, QuestionnaireStatus, number][] = [
      ['in_progress', 'active', -1],
      ['active', 'in_progress', 1],
      ['active', 'active', 0],
      ['released', 'active', 1],
      ['released_once', 'released', 0],
      ['released_twice', 'released_once', 0],
      ['released_twice', 'released', 0],
    ];

    for (const [a, b, expected] of testCases) {
      it(`should sort ${a} ${getPositionText(expected)} ${b}`, () => {
        const instanceA = mockQuestionnaire(1, a, 'once', null, '2024-01-20');
        const instanceB = mockQuestionnaire(2, b, 'once', null, '2024-01-20');
        expect(compareQuestionnaireInstances(instanceA, instanceB)).toBe(
          expected
        );
      });
    }
  });

  describe('sort order', () => {
    const testCases: [number | null, number | null, number][] = [
      [1, 2, -1],
      [2, 1, 1],
      [1, 1, 0],
      [null, 1, 1],
      [1, null, -1],
      [null, null, 0],
    ];

    for (const [a, b, expected] of testCases) {
      it(`should sort ${a} ${getPositionText(expected)} ${b}`, () => {
        const instanceA = mockQuestionnaire(
          1,
          'active',
          'once',
          a,
          '2024-01-20'
        );
        const instanceB = mockQuestionnaire(
          2,
          'active',
          'once',
          b,
          '2024-01-20'
        );
        expect(compareQuestionnaireInstances(instanceA, instanceB)).toBe(
          expected
        );
      });
    }
  });

  describe('date of issue', () => {
    const testCases: [string, string, number][] = [
      ['2024-01-20', '2024-01-21', 1],
      ['2024-01-21', '2024-01-20', -1],
      ['2024-01-20', '2024-01-20', 0],
    ];

    for (const [a, b, expected] of testCases) {
      it(`should sort ${a} ${getPositionText(expected)} ${b}`, () => {
        const instanceA = mockQuestionnaire(1, 'active', 'once', 1, a);
        const instanceB = mockQuestionnaire(2, 'active', 'once', 1, b);

        if (expected > 0) {
          expect(
            compareQuestionnaireInstances(instanceA, instanceB)
          ).toBeGreaterThan(0);
        } else if (expected < 0) {
          expect(
            compareQuestionnaireInstances(instanceA, instanceB)
          ).toBeLessThan(0);
        } else {
          expect(compareQuestionnaireInstances(instanceA, instanceB)).toBe(0);
        }
      });
    }
  });

  function getPositionText(sort: number): string {
    return sort === 0 ? 'equal' : sort === 1 ? 'after' : 'before';
  }

  function mockQuestionnaire(
    id: number,
    status: QuestionnaireStatus,
    cycleUnit: CycleUnit,
    sortOrder: number,
    dateOfIssue: string
  ): QuestionnaireInstance {
    const qi = mock<QuestionnaireInstance>();
    qi.id = id;
    qi.status = status;
    qi.questionnaire.cycle_unit = cycleUnit;
    qi.sort_order = sortOrder;
    qi.date_of_issue = new Date(dateOfIssue);
    return qi;
  }
});
