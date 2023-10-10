/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { IMockBuilder, MockBuilder } from 'ng-mocks';
import { AppModule } from '../../app.module';
import {
  DialogNewProbandComponent,
  DialogNewProbandComponentData,
} from './new-proband-dialog';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import {
  CreateProbandRequest,
  ProbandOrigin,
} from '../../psa.app.core/models/proband';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { first } from 'rxjs/operators';
import {
  createProband,
  createStudy,
} from '../../psa.app.core/models/instance.helper.spec';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

describe('DialogNewProbandComponent', () => {
  let fixture: ComponentFixture<DialogNewProbandComponent>;
  let component: DialogNewProbandComponent;
  let dialogRef: SpyObj<MatDialogRef<DialogNewProbandComponent>>;
  let authService: SpyObj<AuthService>;
  let userService: SpyObj<UserService>;
  let moduleBase: IMockBuilder;

  beforeEach(() => {
    // Provider and Services
    dialogRef = createSpyObj<MatDialogRef<DialogNewProbandComponent>>([
      'close',
    ]);
    authService = createSpyObj<AuthService>(['getProbandByIDS', 'postProband']);
    userService = createSpyObj<UserService>(['getStudies']);

    // Build Base Module
    moduleBase = MockBuilder(DialogNewProbandComponent, AppModule)
      .provide({
        provide: MatDialogRef,
        useValue: dialogRef,
      })
      .mock(AuthService, authService)
      .mock(UserService, userService);

    // Setup  general mocks
    authService.postProband.and.resolveTo(null);
  });

  describe('create new proband', () => {
    beforeEach(async () => {
      // configure module
      await moduleBase;
    });
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      userService.getStudies.and.resolveTo([
        createStudy({ name: 'Test1' }),
        createStudy({ name: 'Test2' }),
      ]);

      // Create component
      fixture = TestBed.createComponent(DialogNewProbandComponent);
      component = fixture.componentInstance;
      fixture.detectChanges(); // run ngOnInit
      tick(); // wait for ngOnInit to finish
    }));

    it('should show the form', async () => {
      expect(component).toBeDefined();
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-compliance-labresults"]'
        )
      ).not.toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-compliance-samples"]'
        )
      ).not.toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-compliance-bloodsamples"]'
        )
      ).not.toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-study-center"]'
        )
      ).not.toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-examination-wave"]'
        )
      ).not.toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-study-name"]'
        )
      ).not.toBeNull();
    });

    it('should filter the study', () => {
      component.filteredStudies.pipe(first()).subscribe((studies) => {
        expect(studies).toEqual(['Test1', 'Test2']);
      });
      component.studiesFilterCtrl.setValue('st2');
      component.filteredStudies.pipe(first()).subscribe((studies) => {
        expect(studies).toEqual(['Test2']);
      });
    });

    it('should submit the form', async () => {
      const postData: CreateProbandRequest = {
        pseudonym: 'Test-1234567890',
        complianceBloodsamples: true,
        complianceLabresults: false,
        complianceSamples: true,
        examinationWave: 5,
        studyCenter: 'test-sz',
        origin: ProbandOrigin.INVESTIGATOR,
      };
      const studyName = 'Test1';
      expect(component).toBeDefined();
      component.form.get('pseudonym').setValue(postData.pseudonym);
      component.form
        .get('complianceBloodsamples')
        .setValue(postData.complianceBloodsamples);
      component.form
        .get('complianceLabresults')
        .setValue(postData.complianceLabresults);
      component.form
        .get('complianceSamples')
        .setValue(postData.complianceSamples);
      component.form.get('examinationWave').setValue(postData.examinationWave);
      component.form.get('studyCenter').setValue(postData.studyCenter);
      component.form.get('studyName').setValue(studyName);
      await component.submit();
      expect(authService.postProband).toHaveBeenCalledOnceWith(
        postData,
        studyName
      );
    });
  });

  describe('register pseudonym on ids', () => {
    beforeEach(async () => {
      // configure module
      const data: DialogNewProbandComponentData = {
        ids: 'ce5a2594-1197-444a-944c-d1392c10cff9',
      };
      await moduleBase.provide({
        provide: MAT_DIALOG_DATA,
        useValue: data,
      });
    });

    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      const u = createProband({
        study: 'Test3',
      });
      authService.getProbandByIDS.and.resolveTo(u);

      // Create component
      fixture = TestBed.createComponent(DialogNewProbandComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick(); // wait for ngOnInit to finish
    }));

    it('should filter the study', () => {
      component.filteredStudies.pipe(first()).subscribe((studies) => {
        expect(studies).toEqual(['Test3']);
      });
      component.studiesFilterCtrl.setValue('st2');
      component.filteredStudies.pipe(first()).subscribe((studies) => {
        expect(studies).toEqual([]);
      });
    });

    it('should submit the form', async () => {
      expect(authService.getProbandByIDS).toHaveBeenCalled();

      const postData: CreateProbandRequest = {
        pseudonym: 'Test-1234567890',
        ids: 'ce5a2594-1197-444a-944c-d1392c10cff9',
        complianceBloodsamples: true,
        complianceLabresults: false,
        complianceSamples: true,
        examinationWave: 5,
        studyCenter: 'test-sz',
        origin: ProbandOrigin.INVESTIGATOR,
      };
      const studyName = 'Test1';
      expect(component).toBeDefined();
      component.form.get('pseudonym').setValue(postData.pseudonym);
      component.form
        .get('complianceBloodsamples')
        .setValue(postData.complianceBloodsamples);
      component.form
        .get('complianceLabresults')
        .setValue(postData.complianceLabresults);
      component.form
        .get('complianceSamples')
        .setValue(postData.complianceSamples);
      component.form.get('examinationWave').setValue(postData.examinationWave);
      component.form.get('studyCenter').setValue(postData.studyCenter);
      component.form.get('studyName').setValue(studyName);
      await component.submit();
      expect(authService.postProband).toHaveBeenCalledOnceWith(
        postData,
        studyName
      );
    });
  });
});
