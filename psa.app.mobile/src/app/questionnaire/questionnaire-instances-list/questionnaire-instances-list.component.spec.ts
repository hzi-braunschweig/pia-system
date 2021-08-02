/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireInstancesListComponent } from './questionnaire-instances-list.component';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { fakeAsync } from '@angular/core/testing';
import { mock } from 'ts-mockito';
import { QuestionnaireInstance } from '../questionnaire.model';
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
      const spontanQI = mock<QuestionnaireInstance>();
      const qI1 = mock<QuestionnaireInstance>();
      const qI2 = mock<QuestionnaireInstance>();
      const qI3 = mock<QuestionnaireInstance>();
      const qI4 = mock<QuestionnaireInstance>();
      const qI5 = mock<QuestionnaireInstance>();
      spontanQI.questionnaire.cycle_unit = 'spontan';
      spontanQI.status = 'active';
      qI1.date_of_issue = new Date('2020-02-02').toISOString();
      qI1.status = 'active';
      qI1.date_of_issue = new Date('2020-02-01').toISOString();
      qI2.status = 'released_once';
      qI2.date_of_issue = new Date('2020-02-01').toISOString();
      qI3.status = 'in_progress';
      qI3.date_of_issue = new Date('2020-02-01').toISOString();
      qI4.status = 'active';
      qI4.date_of_issue = new Date('2020-01-01').toISOString();
      qI5.status = 'active';
      qI5.date_of_issue = new Date('2020-01-01').toISOString();
      fixture = MockRender(
        QuestionnaireInstancesListComponent,
        {
          questionnaireInstances: [spontanQI, qI1, qI2, qI3, qI4, qI5],
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
  });
});
