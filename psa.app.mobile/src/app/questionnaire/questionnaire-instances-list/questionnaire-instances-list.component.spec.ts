/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireInstancesListComponent } from './questionnaire-instances-list.component';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { fakeAsync } from '@angular/core/testing';
import { mock } from 'ts-mockito';
import {
  QuestionnaireInstance,
  QuestionnaireStatus,
  CycleUnit,
} from '../questionnaire.model';
import { QuestionnaireModule } from '../questionnaire.module';

interface QuestionnaireInstancesListComponentParams {
  questionnaireInstances: QuestionnaireInstance[];
}

describe('QuestionnaireInstancesListComponent', () => {
  let fixture: MockedComponentFixture<
    QuestionnaireInstancesListComponent,
    QuestionnaireInstancesListComponentParams
  >;

  beforeEach(async () => {
    await MockBuilder(QuestionnaireInstancesListComponent, QuestionnaireModule);
  });

  describe('no supplied list of questionnaire instances', () => {
    beforeEach(() => {
      fixture = MockRender(
        QuestionnaireInstancesListComponent,
        undefined,
        false
      );
    });

    it('should create', fakeAsync(() => {
      fixture.detectChanges();
    }));
  });

  describe('empty list of questionnaire instances', () => {
    beforeEach(() => {
      fixture = MockRender(
        QuestionnaireInstancesListComponent,
        { questionnaireInstances: [] },
        false
      );
    });

    it('should show a hint for empty questionnaire list', fakeAsync(() => {
      fixture.detectChanges();

      const hint = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-list-empty"]'
      );
      expect(hint).not.toBeNull();

      const qITableSpontan = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-list-spontan"]'
      );
      expect(qITableSpontan).toBeNull();

      const qITableOther = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-list-other"]'
      );
      expect(qITableOther).toBeNull();
    }));
  });
  describe('with list of normal questionnaire instances', () => {
    const qI1 = mock<QuestionnaireInstance>();
    const qI2 = mock<QuestionnaireInstance>();
    const qI3 = mock<QuestionnaireInstance>();
    const qI4 = mock<QuestionnaireInstance>();
    const qI5 = mock<QuestionnaireInstance>();
    qI1.status = 'active';
    qI1.date_of_issue = new Date('2020-02-01').toISOString();
    qI2.status = 'released_once';
    qI2.date_of_issue = new Date('2020-02-01').toISOString();
    qI3.status = 'in_progress';
    qI3.date_of_issue = new Date('2020-02-01').toISOString();
    qI4.status = 'active';
    qI4.date_of_issue = new Date('2020-01-01').toISOString();
    qI5.status = 'active';
    qI5.date_of_issue = new Date('2020-03-01').toISOString();
    beforeEach(() => {
      fixture = MockRender(
        QuestionnaireInstancesListComponent,
        {
          questionnaireInstances: [qI1, qI2, qI3, qI4, qI5],
        },
        false
      );
    });

    it('should show no hint but the qi-list without the spontan qi-list', fakeAsync(() => {
      fixture.detectChanges();

      const hint = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-list-empty"]'
      );
      expect(hint).toBeNull();

      const qITableSpontan = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-list-spontan"]'
      );
      expect(qITableSpontan).toBeNull();

      const qITableOther = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-list-other"]'
      );
      expect(qITableOther).not.toBeNull();
    }));
  });
  describe('with list of spontan questionnaire instances', () => {
    beforeEach(() => {
      fixture = MockRender(
        QuestionnaireInstancesListComponent,
        {
          questionnaireInstances: [
            // --- other ---
            mockQuestionnaire(6, 'active', 'once', null, '2024-01-20'),
            mockQuestionnaire(7, 'active', 'week', null, '2024-01-01'),
            mockQuestionnaire(8, 'active', 'hour', 20, '2024-01-01'),
            mockQuestionnaire(9, 'active', 'month', 10, '2024-01-01'),
            mockQuestionnaire(10, 'active', 'day', 10, '2024-01-20'),
            // --- other: in progress ---
            mockQuestionnaire(1, 'in_progress', 'week', null, '2024-01-01'),
            mockQuestionnaire(2, 'in_progress', 'hour', null, '2024-01-20'),
            mockQuestionnaire(3, 'in_progress', 'day', 20, '2024-01-01'),
            mockQuestionnaire(4, 'in_progress', 'once', 10, '2024-01-01'),
            mockQuestionnaire(5, 'in_progress', 'once', 10, '2024-01-20'),
            // --- on demand ---
            mockQuestionnaire(11, 'active', 'spontan', null, '2024-01-20'),
            mockQuestionnaire(12, 'active', 'spontan', null, '2024-01-01'),
            mockQuestionnaire(13, 'active', 'spontan', 20, '2024-01-01'),
            mockQuestionnaire(14, 'active', 'spontan', 10, '2024-01-20'),
            mockQuestionnaire(15, 'active', 'spontan', 10, '2024-01-01'),
            // --- on demand: in progress ---
            mockQuestionnaire(16, 'in_progress', 'spontan', 15, '2024-01-01'),
            mockQuestionnaire(17, 'in_progress', 'spontan', 5, '2024-01-20'),
            mockQuestionnaire(18, 'in_progress', 'spontan', 5, '2024-01-01'),
          ],
        },
        false
      );
    });

    it('should show no hint but the qi-list and also the spontan qi-list', fakeAsync(() => {
      fixture.detectChanges();

      const hint = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-list-empty"]'
      );
      expect(hint).toBeNull();

      const qITableSpontan = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-list-spontan"]'
      );
      expect(qITableSpontan).not.toBeNull();

      const qITableOther = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-list-other"]'
      );
      expect(qITableOther).not.toBeNull();
    }));

    it('should sort and categorize on demand questionnaire instances', () => {
      fixture.detectChanges();
      const component = fixture.point.componentInstance;
      const onDemandInstancesIds = component.spontanQuestionnaireInstances.map(
        ({ id }) => id
      );
      expect(onDemandInstancesIds).toEqual([17, 18, 16, 14, 15, 13, 11, 12]);
    });

    it('should sort and categorize other questionnaire instances', () => {
      fixture.detectChanges();
      const component = fixture.point.componentInstance;
      const regularInstancesIds = component.otherQuestionnaireInstances.map(
        ({ id }) => id
      );
      expect(regularInstancesIds).toEqual([5, 4, 3, 2, 1, 10, 9, 8, 6, 7]);
    });
  });

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
    qi.date_of_issue = new Date(dateOfIssue).toISOString();
    return qi;
  }
});
