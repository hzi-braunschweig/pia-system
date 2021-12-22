/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { DialogNewIdsComponent } from './new-ids-dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { QuestionnaireService } from '../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { CreateIDSProbandRequest } from '../../psa.app.core/models/proband';
import { fakeAsync, tick } from '@angular/core/testing';
import { createStudy } from '../../psa.app.core/models/instance.helper.spec';
import { first } from 'rxjs/operators';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

describe('DialogNewIdsComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogNewIdsComponent;
  let dialogRef: SpyObj<MatDialogRef<DialogNewIdsComponent>>;
  let authService: SpyObj<AuthService>;
  let questionnaireService: SpyObj<QuestionnaireService>;

  beforeEach(async () => {
    // Provider and Services
    dialogRef = createSpyObj<MatDialogRef<DialogNewIdsComponent>>(['close']);
    authService = createSpyObj<AuthService>(['postIDS']);
    questionnaireService = createSpyObj<QuestionnaireService>(['getStudies']);

    // Build Base Module
    await MockBuilder(DialogNewIdsComponent, AppModule)
      .provide({
        provide: MatDialogRef,
        useValue: dialogRef,
      })
      .mock(AuthService, authService)
      .mock(QuestionnaireService, questionnaireService);
  });

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component
    questionnaireService.getStudies.and.resolveTo({
      studies: [createStudy({ name: 'Test1' }), createStudy({ name: 'Test2' })],
    });
    authService.postIDS.and.resolveTo(null);

    // Create component
    fixture = MockRender(DialogNewIdsComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('should show the form', () => {
    expect(component).toBeDefined();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-unit="new-proband-ids"]')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '[data-unit="new-proband-study-name"]'
      )
    ).not.toBeNull();
  });

  it('should start with all studies and filter the study by filter value', () => {
    component.filteredStudies.pipe(first()).subscribe((studies) => {
      expect(studies).toEqual(['Test1', 'Test2']);
    });
    component.filteredStudies.pipe(first()).subscribe((studies) => {
      expect(studies).toEqual(['Test1', 'Test2']);
    });
    component.studiesFilterCtrl.setValue('st2');
    component.filteredStudies.pipe(first()).subscribe((studies) => {
      expect(studies).toEqual(['Test2']);
    });
  });

  it('should submit the form', async () => {
    const postData: CreateIDSProbandRequest = {
      ids: 'bb88ab27-c377-4fac-8141-8bca45c1d12c',
    };
    const studyName = 'Test1';
    expect(component).toBeDefined();
    component.form.get('ids').setValue(postData.ids);
    component.form.get('studyName').setValue(studyName);
    await component.submit();
    expect(authService.postIDS).toHaveBeenCalledOnceWith(postData, studyName);
  });
});
