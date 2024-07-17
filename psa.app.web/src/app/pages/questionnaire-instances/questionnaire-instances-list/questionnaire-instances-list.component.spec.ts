/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireInstancesListComponent } from './questionnaire-instances-list.component';
import {
  MockBuilder,
  MockedComponentFixture,
  MockInstance,
  MockRender,
} from 'ng-mocks';
import { AppModule } from '../../../app.module';
import { fakeAsync } from '@angular/core/testing';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  QuestionnaireInstance,
  QuestionnaireStatus,
} from '../../../psa.app.core/models/questionnaireInstance';
import { mock } from 'ts-mockito';
import { Router } from '@angular/router';
import Spy = jasmine.Spy;
import createSpy = jasmine.createSpy;
import { CycleUnit } from '../../../psa.app.core/models/questionnaire';

interface QuestionnaireInstancesListComponentParams {
  questionnaireInstances: QuestionnaireInstance[];
}

describe('QuestionnaireInstancesListComponent', () => {
  let fixture: MockedComponentFixture<
    QuestionnaireInstancesListComponent,
    QuestionnaireInstancesListComponentParams
  >;
  let setPaginator: Spy;
  let setSort: Spy;
  let setFilter: Spy;
  let navigateSpy;

  function stubTableDataSource(
    datasource: MatTableDataSource<QuestionnaireInstance>
  ): void {
    setPaginator = spyOnProperty(datasource, 'paginator', 'set').and.stub();
    setSort = spyOnProperty(datasource, 'sort', 'set').and.stub();
    setFilter = spyOnProperty(datasource, 'filter', 'set').and.stub();
  }

  beforeEach(async () => {
    await MockBuilder(QuestionnaireInstancesListComponent, AppModule).mock(
      MatPaginator
    );
    navigateSpy = MockInstance(Router, 'navigate', createSpy());
  });

  describe('no supplied list of questionnaire instances', () => {
    beforeEach(() => {
      fixture = MockRender(
        QuestionnaireInstancesListComponent,
        undefined,
        false
      );
      stubTableDataSource(fixture.point.componentInstance.qDatasource);
    });

    it('should create and set the table paginator and sort attributes', fakeAsync(() => {
      fixture.detectChanges();
      expect(setSort).toHaveBeenCalled();
      expect(setPaginator).toHaveBeenCalled();
    }));
  });

  describe('empty list of questionnaire instances', () => {
    beforeEach(() => {
      fixture = MockRender(
        QuestionnaireInstancesListComponent,
        { questionnaireInstances: [] },
        false
      );
      stubTableDataSource(fixture.point.componentInstance.qDatasource);
    });

    it('should create and set the table paginator and sort attributes', fakeAsync(() => {
      fixture.detectChanges();
      expect(setSort).toHaveBeenCalled();
      expect(setPaginator).toHaveBeenCalled();
    }));

    it('should show the filter input field with the qi-table but without the spontan qi-table', fakeAsync(() => {
      fixture.detectChanges();

      const filter = fixture.nativeElement.querySelector(
        '[data-unit="unit-filter-input-field"]'
      );
      expect(filter).not.toBeNull();

      const qITable = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-table"]'
      );
      expect(qITable).not.toBeNull();

      const qITableSpontan = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-table-spontan"]'
      );
      expect(qITableSpontan).toBeNull();
    }));
  });
  describe('with list of normal questionnaire instances', () => {
    const qI1 = mock<QuestionnaireInstance>();
    const qI2 = mock<QuestionnaireInstance>();
    const qI3 = mock<QuestionnaireInstance>();
    const qI4 = mock<QuestionnaireInstance>();
    const qI5 = mock<QuestionnaireInstance>();
    qI1.status = 'active';
    qI1.date_of_issue = new Date('2020-02-01');
    qI2.status = 'released_once';
    qI3.status = 'in_progress';
    qI4.status = 'active';
    qI4.date_of_issue = new Date('2020-01-01');
    qI5.status = 'active';
    qI5.date_of_issue = new Date('2020-03-01');
    beforeEach(() => {
      fixture = MockRender(
        QuestionnaireInstancesListComponent,
        {
          questionnaireInstances: [qI1, qI2, qI3, qI4, qI5],
        },
        false
      );
      stubTableDataSource(fixture.point.componentInstance.qDatasourceSpontan);
      stubTableDataSource(fixture.point.componentInstance.qDatasource);
    });

    it('should create and set the table paginator and sort attributes', fakeAsync(() => {
      fixture.detectChanges();
      expect(setSort).toHaveBeenCalled();
      expect(setPaginator).toHaveBeenCalled();
    }));

    it('should show the filter input field with the qi-table but without the spontan qi-table', fakeAsync(() => {
      fixture.detectChanges();

      const filter = fixture.nativeElement.querySelector(
        '[data-unit="unit-filter-input-field"]'
      );
      expect(filter).not.toBeNull();

      const qITable = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-table"]'
      );
      expect(qITable).not.toBeNull();

      const qITableSpontan = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-table-spontan"]'
      );
      expect(qITableSpontan).toBeNull();
    }));

    it('set the filter for qDatasource', fakeAsync(() => {
      fixture.point.componentInstance.applyFilter(' Test 1234 ');
      expect(setFilter).toHaveBeenCalledWith('test 1234');
    }));

    it('select an instance for editing', fakeAsync(() => {
      fixture.point.componentInstance.editOrViewQuestionnaire(90, 2, 'active');
      expect(navigateSpy).toHaveBeenCalled();
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
      stubTableDataSource(fixture.point.componentInstance.qDatasource);
    });

    it('should create and set the table paginator and sort attributes', fakeAsync(() => {
      fixture.detectChanges();
      expect(setSort).toHaveBeenCalled();
      expect(setPaginator).toHaveBeenCalled();
    }));

    it('should show the filter input field with the qi-table and also the spontan qi-table', fakeAsync(() => {
      fixture.detectChanges();

      const filter = fixture.nativeElement.querySelector(
        '[data-unit="unit-filter-input-field"]'
      );
      expect(filter).not.toBeNull();

      const qITable = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-table"]'
      );
      expect(qITable).not.toBeNull();

      const qITableSpontan = fixture.nativeElement.querySelector(
        '[data-unit="unit-questionnaire-instances-table-spontan"]'
      );
      expect(qITableSpontan).not.toBeNull();
    }));

    it('should sort and categorize on demand questionnaire instances', () => {
      fixture.detectChanges();
      const component = fixture.point.componentInstance;
      const onDemandInstancesIds = component.qDatasourceSpontan.data.map(
        ({ id }) => id
      );
      expect(onDemandInstancesIds).toEqual([17, 18, 16, 14, 15, 13, 11, 12]);
    });

    it('should sort and categorize other questionnaire instances', () => {
      fixture.detectChanges();
      const component = fixture.point.componentInstance;
      const regularInstancesIds = component.qDatasource.data.map(
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
    qi.date_of_issue = new Date(dateOfIssue);
    return qi;
  }
});
