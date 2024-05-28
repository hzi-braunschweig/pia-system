/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';

import { AppModule } from '../../app.module';
import { DialogStudyComponent } from './study-dialog';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import { CurrentUser } from '../../_services/current-user.service';
import { Study } from '../../psa.app.core/models/study';
import { AlertService } from '../../_services/alert.service';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

describe('DialogStudyComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogStudyComponent;

  let existingStudy: { name?: string };
  let userService: SpyObj<UserService>;
  let user: SpyObj<CurrentUser>;

  beforeEach(async () => {
    // Provider and Services
    existingStudy = {};
    userService = createSpyObj<UserService>('UserService', [
      'getStudy',
      'putStudy',
      'postStudy',
    ]);
    user = createSpyObj<CurrentUser>('CurrentUser', ['hasRole']);
    user.hasRole.and.returnValue(false);

    // Build Base Module
    await MockBuilder(DialogStudyComponent, [
      AppModule,
      MAT_DIALOG_DATA,
      MatDialogRef,
    ])
      .mock(AlertService)
      .mock(MAT_DIALOG_DATA, existingStudy)
      .mock(UserService, userService)
      .mock(CurrentUser, user);
  });

  describe('ngOnInit()', () => {
    it('should initialize an existing study', fakeAsync(() => {
      // Arrange
      existingStudy.name = 'Teststudy';
      userService.getStudy.and.resolveTo(createStudy());

      // Act
      createComponent();

      // Assert
      expect(userService.getStudy).toHaveBeenCalledOnceWith('Teststudy');
      expect(component.isEditMode).toBeTrue();
      expect(component.form.get('name').value).toEqual('Teststudy');
      expect(component.form.get('description').value).toEqual(
        'the description'
      );
    }));

    it('should initialize a new study', fakeAsync(() => {
      // Arrange
      existingStudy.name = undefined;

      // Act
      createComponent();

      // Assert
      expect(userService.getStudy).not.toHaveBeenCalled();
      expect(component.isEditMode).toBeFalse();
      expect(component.form.get('name').value).toEqual(null);
      expect(component.form.get('description').value).toEqual(null);
      expect(component.form.get('has_rna_samples').value).toEqual(false);
    }));
  });

  describe('submit()', () => {
    it('should update an existing study', fakeAsync(() => {
      // Arrange
      existingStudy.name = 'Teststudy';
      userService.getStudy.and.resolveTo(createStudy());
      createComponent();
      component.form.get('description').setValue('a description');
      component.form.get('pm_email').setValue('test@example.com');
      component.form.get('hub_email').setValue('test@example.com');
      component.form.get('has_rna_samples').setValue(true);
      component.form.get('sample_prefix').setValue('TEST');
      component.form.get('sample_suffix_length').setValue(3);
      component.form.get('has_required_totp').setValue(true);

      // Act
      component.submit();

      // Assert
      expect(userService.putStudy).toHaveBeenCalledOnceWith('Teststudy', {
        name: 'Teststudy',
        description: 'a description',
        has_open_self_registration: false,
        max_allowed_accounts_count: null,
        pm_email: 'test@example.com',
        hub_email: 'test@example.com',
        has_rna_samples: true,
        sample_prefix: 'TEST',
        sample_suffix_length: 3,
        pseudonym_prefix: 'PREFIX',
        pseudonym_suffix_length: 5,
        has_required_totp: true,
      });
    }));

    it('should create a new study', fakeAsync(() => {
      // Arrange
      existingStudy.name = undefined;
      createComponent();
      component.form.get('name').setValue('a new study');
      component.form.get('description').setValue('a description');
      component.form.get('pm_email').setValue('test@example.com');
      component.form.get('has_rna_samples').setValue(true);
      component.form.get('sample_prefix').setValue('TEST');
      component.form.get('sample_suffix_length').setValue(3);

      // Act
      component.submit();

      // Assert
      expect(userService.postStudy).toHaveBeenCalledOnceWith({
        name: 'a new study',
        description: 'a description',
        has_open_self_registration: false,
        max_allowed_accounts_count: null,
        pm_email: 'test@example.com',
        hub_email: null,
        has_rna_samples: true,
        has_required_totp: true,
        sample_prefix: 'TEST',
        sample_suffix_length: 3,
        pseudonym_prefix: '',
        pseudonym_suffix_length: null,
      });
    }));

    it('should close the dialog', fakeAsync(() => {
      // Arrange
      userService.postStudy.and.resolveTo(createStudy());
      createComponent();
      const dialogRef = TestBed.inject(MatDialogRef);

      // Act
      component.submit();
      tick();

      // Assert
      expect(dialogRef.close).toHaveBeenCalledTimes(1);
    }));

    it('should show error alert', fakeAsync(() => {
      // Arrange
      userService.postStudy.and.rejectWith('some error');
      createComponent();
      const alertService = TestBed.inject(AlertService);

      // Act
      component.submit();
      tick();

      // Assert
      expect(alertService.errorObject).toHaveBeenCalledTimes(1);
    }));
  });

  function createComponent(): void {
    // Create component
    fixture = MockRender(DialogStudyComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }

  function createStudy(): Study {
    return {
      name: 'Teststudy',
      description: 'the description',
      has_open_self_registration: false,
      max_allowed_accounts_count: null,
      pm_email: null,
      hub_email: null,
      status: 'active',
      has_rna_samples: false,
      sample_prefix: '',
      sample_suffix_length: null,
      pseudonym_prefix: 'PREFIX',
      pseudonym_suffix_length: 5,
      has_answers_notify_feature: false,
      has_answers_notify_feature_by_mail: false,
      has_four_eyes_opposition: false,
      has_partial_opposition: false,
      has_total_opposition: false,
      has_compliance_opposition: false,
      has_logging_opt_in: false,
      has_required_totp: false,
      pendingStudyChange: null,
    };
  }
});
