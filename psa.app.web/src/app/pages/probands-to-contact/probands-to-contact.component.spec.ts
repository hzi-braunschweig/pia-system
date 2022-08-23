/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from 'src/app/app.module';
import { fakeAsync, tick } from '@angular/core/testing';
import {
  ProbandsToContactComponent,
  TableRow,
} from './probands-to-contact.component';
import { ProbandService } from '../../psa.app.core/providers/proband-service/proband.service';
import { PersonalDataService } from '../../psa.app.core/providers/personaldata-service/personaldata-service';
import {
  createPersonalData,
  createProbandToContact,
} from '../../psa.app.core/models/instance.helper.spec';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import SpyObj = jasmine.SpyObj;
import { MatCardModule } from '@angular/material/card';

describe('ProbandsToContactComponent', () => {
  let fixture: MockedComponentFixture;
  let component: ProbandsToContactComponent;
  let matDialog: SpyObj<MatDialog>;
  let router: SpyObj<Router>;
  let probandService: SpyObj<ProbandService>;
  let personalDataService: SpyObj<PersonalDataService>;
  const DATE1 = new Date('2020-01-01');
  const DATE2 = new Date('2020-02-02');

  beforeEach(async () => {
    // Provider and Services
    probandService = jasmine.createSpyObj(ProbandService, [
      'getProbandsToContact',
      'putProbandToContact',
    ]);
    personalDataService = jasmine.createSpyObj(PersonalDataService, [
      'getPersonalDataAll',
    ]);
    matDialog = jasmine.createSpyObj(MatDialog, ['open']);
    router = jasmine.createSpyObj(Router, ['navigate']);

    // Build Base Module
    await MockBuilder(ProbandsToContactComponent, AppModule)
      .keep(MatPaginatorModule)
      .keep(MatSortModule)
      .keep(MatCardModule)
      .mock(MatDialog, matDialog)
      .mock(Router, router)
      .mock(PersonalDataService, personalDataService)
      .mock(ProbandService, probandService);
  });

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component
    probandService.getProbandsToContact.and.resolveTo([
      createProbandToContact({
        id: 1,
        user_id: 'test-000',
        notable_answer_questionnaire_instances: [
          { questionnaire_name: 'Test questionnaire 1' },
          { questionnaire_name: 'Test questionnaire 2' },
          { questionnaire_name: 'Test questionnaire 1' },
        ],
        is_notable_answer: true,
        is_notable_answer_at: DATE1,
        processed: false,
      }),
      createProbandToContact({
        id: 2,
        user_id: 'test-001',
        ids: 'TEST-001',
        not_filledout_questionnaire_instances: [
          { questionnaire_name: 'Test questionnaire 1' },
          { questionnaire_name: 'Test questionnaire 2' },
        ],
        is_not_filledout: true,
        is_not_filledout_at: DATE2,
        processed: false,
      }),
    ]);
    personalDataService.getPersonalDataAll.and.resolveTo([
      createPersonalData({
        pseudonym: 'test-000',
        vorname: 'John',
        name: 'Doe',
      }),
    ]);

    // Create component
    fixture = MockRender(ProbandsToContactComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
    fixture.detectChanges();
  }));

  it('should create the component and create the datasource with converted data', () => {
    expect(component).toBeDefined();

    expect(probandService.getProbandsToContact).toHaveBeenCalled();
    expect(personalDataService.getPersonalDataAll).toHaveBeenCalled();

    const data = component.dataSource.data;

    expect(data).toHaveSize(2);
    const row1 = data.find((row) => row.id === 1);
    expect(row1).toBeDefined();
    const expectedRow1: TableRow = {
      id: 1,
      username: 'test-000',
      ids: null,
      notable: true,
      notableAnswerQIs: [
        'Test questionnaire 1 (2)',
        'Test questionnaire 2 (1)',
      ],
      notable_timestamp: DATE1,
      accountStatus: undefined,
      firstname: 'John',
      lastname: 'Doe',
      notFilledout: undefined,
      notFilledoutQIs: [],
      notFilledout_timestamp: undefined,
      processed: false,
    };
    expect(row1).toEqual(expectedRow1);

    const row2 = data.find((row) => row.id === 2);
    expect(row2).toBeDefined();
    const expectedRow2: TableRow = {
      id: 2,
      username: '',
      ids: 'TEST-001',
      notable: undefined,
      notableAnswerQIs: [],
      notable_timestamp: undefined,
      accountStatus: undefined,
      firstname: '',
      lastname: '',
      notFilledout: true,
      notFilledoutQIs: ['Test questionnaire 1 (1)', 'Test questionnaire 2 (1)'],
      notFilledout_timestamp: DATE2,
      processed: false,
    };
    expect(row2).toEqual(expectedRow2);
  });

  it('should set the second entry to processed', async () => {
    await component.setProcessed(2, true);
    expect(probandService.putProbandToContact).toHaveBeenCalled();
    expect(matDialog.open).toHaveBeenCalled();
  });

  it('should navigate to contact page when clicking on contact-button', () => {
    component.contactProband('test-000');
    expect(router.navigate).toHaveBeenCalledWith([
      '/contact-proband/',
      'test-000',
    ]);
  });

  it('should navigate to personal data page when clicking on view-button', () => {
    component.viewContactInfo('test-000');
    expect(router.navigate).toHaveBeenCalledWith([
      '/probands-personal-info/',
      'test-000',
    ]);
  });

  it('should filter by notable answers', () => {
    component.filterByNotableAnswer();
    expect(component.dataSource.filteredData).toHaveSize(1);
  });

  it('should filter by not filled out', () => {
    component.filterByNotFilledout();
    expect(component.dataSource.filteredData).toHaveSize(1);
  });

  it('should reset the filter', () => {
    component.filterByNotFilledout();
    component.resetFilter();
    expect(component.dataSource.filteredData).toHaveSize(2);
  });
});
