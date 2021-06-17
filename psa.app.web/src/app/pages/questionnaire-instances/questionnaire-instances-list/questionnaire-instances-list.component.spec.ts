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
import { QuestionnaireInstance } from '../../../psa.app.core/models/questionnaireInstance';
import { mock } from 'ts-mockito';
import { Router } from '@angular/router';
import Spy = jasmine.Spy;
import createSpy = jasmine.createSpy;

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
      const spontanQI = mock<QuestionnaireInstance>();
      spontanQI.questionnaire.cycle_unit = 'spontan';
      spontanQI.status = 'active';
      fixture = MockRender(
        QuestionnaireInstancesListComponent,
        {
          questionnaireInstances: [
            spontanQI,
            mock<QuestionnaireInstance>(),
            mock<QuestionnaireInstance>(),
            mock<QuestionnaireInstance>(),
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
  });
});
