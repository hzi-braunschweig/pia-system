/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../../app.module';
import {
  MatLegacyDialog as MatDialog,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SamplesComponent } from './samples.component';
import { CurrentUser } from '../../../_services/current-user.service';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import {
  createBloodSample,
  createLabResult,
  createPendingDeletion,
  createProband,
  createStudy,
} from '../../../psa.app.core/models/instance.helper.spec';
import { Subject } from 'rxjs';
import { DialogDeletePartnerComponent } from '../../../_helpers/dialog-delete-partner';
import { PendingSampleDeletion } from '../../../psa.app.core/models/pendingDeletion';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { ScanDialogComponent } from '../sample-scan-dialog/scan-dialog.component';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { Location } from '@angular/common';
import { RemarkDialogComponent } from '../sample-remark-dialog/remark-dialog.component';
import { DialogInfoComponent } from '../../../_helpers/dialog-info';
import { DialogYesNoComponent } from '../../../_helpers/dialog-yes-no';
import { AlertService } from '../../../_services/alert.service';
import SpyObj = jasmine.SpyObj;

describe('SamplesComponent', () => {
  let fixture: MockedComponentFixture;
  let component: SamplesComponent;

  let user: SpyObj<CurrentUser>;
  let dialog: SpyObj<MatDialog>;
  let activatedRoute: SpyObj<ActivatedRoute>;
  let activatedRouteSnapshot: ActivatedRouteSnapshot;
  let authService: SpyObj<AuthService>;
  let sampleTrackingService: SpyObj<SampleTrackingService>;
  let userService: SpyObj<UserService>;
  let afterClosedSubject: Subject<any>;

  beforeEach(async () => {
    user = jasmine.createSpyObj<CurrentUser>('CurrentUser', ['hasRole'], {
      username: 'SomeProfessional',
    });
    user.hasRole.and.returnValue(true);
    activatedRouteSnapshot = new ActivatedRouteSnapshot();
    activatedRouteSnapshot.params = { pseudonym: 'Testproband' };
    activatedRouteSnapshot.queryParams = {
      deactivated: 'true',
      pendingDeletionId: '1234',
    };
    activatedRoute = jasmine.createSpyObj<ActivatedRoute>(
      'ActivatedRoute',
      [],
      {
        snapshot: activatedRouteSnapshot,
      }
    );
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getProband',
      'getPendingDeletion',
      'getPendingDeletionForSampleId',
    ]);
    authService.getProband.and.resolveTo(
      createProband({
        complianceBloodsamples: true,
        complianceSamples: true,
      })
    );
    authService.getPendingDeletion.and.resolveTo(
      createPendingDeletion({
        id: 1234,
        requested_by: 'SomeProfessional',
        requested_for: 'SomeOtherProfessional',
      })
    );
    authService.getPendingDeletionForSampleId.and.resolveTo(
      createPendingDeletion({
        id: 1234,
        requested_for: 'SomeProfessional',
        type: 'study',
      }) as PendingSampleDeletion
    );
    sampleTrackingService = jasmine.createSpyObj<SampleTrackingService>(
      'SampleTrackingService',
      [
        'getAllBloodSamplesForUser',
        'getAllLabResultsForUser',
        'postLabResult',
        'postBloodSample',
        'putLabResult',
        'putBloodSample',
      ]
    );
    sampleTrackingService.getAllBloodSamplesForUser.and.resolveTo([
      createBloodSample({ blood_sample_carried_out: true }),
      createBloodSample({ blood_sample_carried_out: false }),
      createBloodSample({ blood_sample_carried_out: null }),
    ]);
    sampleTrackingService.getAllLabResultsForUser.and.resolveTo([
      createLabResult(),
      createLabResult({ study_status: 'deletion_pending' }),
      createLabResult({ study_status: 'deleted' }),
    ]);
    sampleTrackingService.postLabResult.and.resolveTo();
    sampleTrackingService.postBloodSample.and.resolveTo();
    afterClosedSubject = new Subject<any>();
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({
      afterClosed: () => afterClosedSubject.asObservable(),
    } as unknown as MatDialogRef<DialogDeletePartnerComponent>);
    userService = jasmine.createSpyObj<UserService>('UserService', [
      'getStudy',
    ]);
    userService.getStudy.and.resolveTo(createStudy({ name: 'NAKO Test' }));

    // Build Base Module
    await MockBuilder(SamplesComponent, AppModule)
      .mock(CurrentUser, user)
      .mock(ActivatedRoute, activatedRoute)
      .mock(AuthService, authService)
      .mock(MatDialog, dialog)
      .mock(SampleTrackingService, sampleTrackingService)
      .mock(UserService, userService);
  });

  describe('ngOnInit()', () => {
    it('should load the proband', fakeAsync(() => {
      createComponent();
      expect(authService.getProband).toHaveBeenCalledOnceWith('Testproband');
      expect(component.proband.pseudonym).toEqual('Testproband');
    }));

    it('should initialize the pending deletion', fakeAsync(() => {
      createComponent();
      expect(authService.getPendingDeletion).toHaveBeenCalledOnceWith(1234);
      expect(dialog.open).toHaveBeenCalledOnceWith(
        DialogDeletePartnerComponent,
        {
          width: '400px',
          data: {
            usernames: {
              sampleId: 'TEST-0000000000',
              usernamePM: 'SomeProfessional',
            },
            type: 'study',
            pendingdeletionId: 1234,
            affectedStudy: 'NAKO Test',
          },
        }
      );
    }));

    it('should not initialize the pending deletion', fakeAsync(() => {
      activatedRoute.snapshot.queryParams = {};
      createComponent();
      expect(authService.getPendingDeletion).not.toHaveBeenCalled();
    }));

    it('should handle authorization errors of pending deletion request', fakeAsync(() => {
      authService.getPendingDeletion.and.rejectWith({
        error: {
          message: 'The requester is not allowed to get this pending deletion',
        },
      });
      createComponent();
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'PROBANDEN.PENDING_DELETE_ERROR',
          isSuccess: false,
        },
      });
    }));

    it('should handle not found errors of pending deletion request', fakeAsync(() => {
      authService.getPendingDeletion.and.rejectWith({
        error: {
          message: 'The pending deletion was not found',
        },
      });
      createComponent();
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'PROBANDEN.PENDING_DELETION_NOT_FOUND',
          isSuccess: false,
        },
      });
    }));

    it('should handle wrong role errors of pending deletion request', fakeAsync(() => {
      authService.getPendingDeletion.and.rejectWith({
        error: {
          message: 'Could not get the pending deletion: Unknown or wrong role',
        },
      });
      createComponent();
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'PROBANDEN.PENDING_DELETION_WRONG_ROLE',
          isSuccess: false,
        },
      });
    }));

    it('should handle unknown errors of pending deletion request', fakeAsync(() => {
      authService.getPendingDeletion.and.rejectWith('some unknown error');
      createComponent();
      const alertService = TestBed.inject(AlertService) as SpyObj<AlertService>;
      expect(alertService.errorObject).toHaveBeenCalled();
    }));

    it('should initialize the blutproben table', fakeAsync(() => {
      createComponent();
      expect(
        sampleTrackingService.getAllBloodSamplesForUser
      ).toHaveBeenCalledOnceWith('Testproband');
      expect(component.dataSourceBlutproben.data).toHaveSize(3);
      expect(
        component.dataSourceBlutproben.data[1].blood_sample_carried_out_value
      ).toEqual('SAMPLES.BLOOD_SAMPLE_NOT_CARRIED_OUT');
    }));

    it('should initialize the lab result table', fakeAsync(() => {
      createComponent();
      expect(
        sampleTrackingService.getAllLabResultsForUser
      ).toHaveBeenCalledOnceWith('Testproband');
      expect(
        authService.getPendingDeletionForSampleId
      ).toHaveBeenCalledOnceWith('1');
      expect(component.dataSourceNasenabstriche.data).toHaveSize(3);
      expect(component.dataSourceNasenabstriche.data[1].study_status).toEqual(
        'STUDIES.STATUS_DELETION_PENDING'
      );
      expect(
        component.dataSourceNasenabstriche.data[1].pendingDeletionObject.id
      ).toEqual(1234);
    }));
  });

  describe('applyFilterBlutproben()', () => {
    beforeEach(fakeAsync(() => createComponent()));

    it('should set the filter on the data source', () => {
      component.applyFilterBlutproben('Keyword ');
      expect(component.dataSourceBlutproben.filter).toEqual('keyword');
    });
  });

  describe('applyFilterNasenabstriche()', () => {
    beforeEach(fakeAsync(() => createComponent()));

    it('should set the filter on the data source', () => {
      component.applyFilterNasenabstriche('Keyword ');
      expect(component.dataSourceNasenabstriche.filter).toEqual('keyword');
    });
  });

  describe('onScanButtonClicked()', () => {
    beforeEach(fakeAsync(() => createComponent()));

    it('should open the scan dialog with correct data', fakeAsync(() => {
      // Arrange
      dialog.open.calls.reset();

      // Act
      component.onScanButtonClicked(true);
      tick();

      // Assert
      expect(userService.getStudy).toHaveBeenCalledOnceWith('NAKO Test');
      expect(dialog.open).toHaveBeenCalledOnceWith(ScanDialogComponent, {
        width: '350px',
        disableClose: true,
        data: {
          isBloodSample: true,
          study: createStudy({ name: 'NAKO Test' }),
        },
      });
    }));

    it('should save a blood sample', fakeAsync(() => {
      // Arrange
      dialog.open.calls.reset();

      // Act
      component.onScanButtonClicked(true);
      tick();
      afterClosedSubject.next({ sample_id: 'TEST-1234' });
      tick();

      // Assert
      expect(sampleTrackingService.postBloodSample).toHaveBeenCalledOnceWith(
        'Testproband',
        { sample_id: 'TEST-1234' }
      );
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'QUESTION_PROBAND.SCANNING_SUCCESS',
          isSuccess: true,
        },
      });
    }));

    it('should save a lab result', fakeAsync(() => {
      // Arrange
      dialog.open.calls.reset();

      // Act
      component.onScanButtonClicked(false);
      tick();
      afterClosedSubject.next({ sample_id: 'TEST-1234' });
      tick();

      // Assert
      expect(sampleTrackingService.postLabResult).toHaveBeenCalledOnceWith(
        'Testproband',
        {
          sample_id: 'TEST-1234',
          new_samples_sent: null,
        }
      );
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'QUESTION_PROBAND.SCANNING_SUCCESS',
          isSuccess: true,
        },
      });
    }));

    it('should handle proben id already exists error', fakeAsync(() => {
      // Arrange
      dialog.open.calls.reset();
      sampleTrackingService.postLabResult.and.rejectWith({ status: 409 });

      // Act
      component.onScanButtonClicked(false);
      tick();
      afterClosedSubject.next({ sample_id: 'TEST-1234' });
      tick();

      // Assert
      expect(sampleTrackingService.postLabResult).toHaveBeenCalled();
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'SAMPLES.PROBEN_ID_ALREADY_EXISTS',
          isSuccess: false,
        },
      });
    }));

    it('should handle unknown errors', fakeAsync(() => {
      // Arrange
      dialog.open.calls.reset();
      sampleTrackingService.postLabResult.and.rejectWith('some error');

      // Act
      component.onScanButtonClicked(false);
      tick();
      afterClosedSubject.next({ sample_id: 'TEST-1234' });
      tick();

      // Assert
      expect(sampleTrackingService.postLabResult).toHaveBeenCalled();
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'SAMPLES.COULD_NOT_SCAN',
          isSuccess: false,
        },
      });
    }));
  });

  describe('onBackButtonClicked()', () => {
    beforeEach(fakeAsync(() => createComponent()));

    it('should go back in location history', () => {
      const location = TestBed.inject(Location) as SpyObj<Location>;
      component.onBackButtonClicked();
      expect(location.back).toHaveBeenCalled();
    });
  });

  describe('onEditCellClicked()', () => {
    beforeEach(fakeAsync(() => createComponent()));

    it('should edit the remark', fakeAsync(() => {
      // Arrange
      sampleTrackingService.putLabResult.and.resolveTo(
        createLabResult({
          remark: 'some new remark',
          new_samples_sent: true,
          date_of_sampling: '2020-12-12',
        })
      );

      // Act
      component.onEditCellClicked({
        id: '1234',
        remark: 'some remark',
        new_samples_sent: true,
        date_of_sampling: '2020-12-12',
      });
      afterClosedSubject.next('some new remark');
      tick();

      // Arrange
      expect(sampleTrackingService.putLabResult).toHaveBeenCalledOnceWith(
        'Testproband',
        '1234',
        {
          remark: 'some new remark',
          new_samples_sent: true,
          date_of_sampling: '2020-12-12',
        }
      );
    }));
  });

  describe('onSamplesSentCheckBoxChecked()', () => {
    beforeEach(fakeAsync(() => createComponent()));

    it('should edit new_samples_sent', fakeAsync(() => {
      // Arrange
      sampleTrackingService.putLabResult.and.resolveTo(
        createLabResult({
          remark: ' ',
          new_samples_sent: true,
          date_of_sampling: undefined,
        })
      );

      // Act
      component.onSamplesSentCheckBoxChecked({
        id: '1234',
        remark: null,
        new_samples_sent: true,
        date_of_sampling: null,
      });

      // Arrange
      expect(sampleTrackingService.putLabResult).toHaveBeenCalledOnceWith(
        'Testproband',
        '1234',
        {
          remark: ' ',
          new_samples_sent: true,
          date_of_sampling: undefined,
        }
      );
    }));
  });

  describe('onEditSampleStatusClicked()', () => {
    beforeEach(fakeAsync(() => createComponent()));

    it('should update the blood sample', fakeAsync(() => {
      // Arrange
      const rowContent = {
        ...createBloodSample(),
        blood_sample_carried_out_value: '',
      };

      // Act
      component.onEditSampleStatusClicked(rowContent, false);

      // Assert
      expect(sampleTrackingService.putBloodSample).toHaveBeenCalledOnceWith(
        'Testproband',
        'TEST-111111',
        { blood_sample_carried_out: false }
      );
    }));

    it('should handle proben id already exists error', fakeAsync(() => {
      // Arrange
      dialog.open.calls.reset();
      sampleTrackingService.putBloodSample.and.rejectWith({ status: 409 });
      const rowContent = {
        ...createBloodSample(),
        blood_sample_carried_out_value: '',
      };

      // Act
      component.onEditSampleStatusClicked(rowContent, false);
      tick();

      // Assert
      expect(sampleTrackingService.putBloodSample).toHaveBeenCalled();
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'SAMPLES.PROBEN_ID_ALREADY_EXISTS',
          isSuccess: false,
        },
      });
    }));

    it('should handle proben id already exists error', fakeAsync(() => {
      // Arrange
      dialog.open.calls.reset();
      sampleTrackingService.putBloodSample.and.rejectWith('some error');
      const rowContent = {
        ...createBloodSample(),
        blood_sample_carried_out_value: '',
      };

      // Act
      component.onEditSampleStatusClicked(rowContent, false);
      tick();

      // Assert
      expect(sampleTrackingService.putBloodSample).toHaveBeenCalled();
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'SAMPLES.COULD_NOT_SCAN',
          isSuccess: false,
        },
      });
    }));
  });

  describe('onEditSampleRemarkClicked', () => {
    beforeEach(fakeAsync(() => createComponent()));

    it('should update the blood sample', fakeAsync(() => {
      // Arrange
      dialog.open.calls.reset();
      sampleTrackingService.putBloodSample.and.resolveTo(createBloodSample());
      const rowContent = {
        ...createBloodSample(),
        status: true,
        remark: '',
      };

      // Act
      component.onEditSampleRemarkClicked(rowContent);
      afterClosedSubject.next('new remark');
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(RemarkDialogComponent, {
        width: '250px',
        data: { remark: '' },
      });
      expect(sampleTrackingService.putBloodSample).toHaveBeenCalledOnceWith(
        'Testproband',
        'TEST-111111',
        { remark: 'new remark', blood_sample_carried_out: true }
      );
    }));
  });

  describe('onDeactivateRow()', () => {
    beforeEach(fakeAsync(() => createComponent()));

    it('should update lab result status from inactivate to new', async () => {
      // Arrange
      const row = {
        ...createLabResult({ status: 'inactive' }),
        pendingDeletionObject: null,
      };

      // Act
      await component.onDeactivateRow(row);

      // Assert
      expect(sampleTrackingService.putLabResult).toHaveBeenCalledOnceWith(
        'Testproband',
        '1',
        {
          status: 'new',
        }
      );
    });

    it('should update lab result status from new to inactive', fakeAsync(() => {
      // Arrange
      const row = {
        ...createLabResult({ status: 'new' }),
        pendingDeletionObject: null,
      };

      // Act
      component.onDeactivateRow(row);
      afterClosedSubject.next('yes');
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogYesNoComponent, {
        width: '300px',
        data: { content: 'SAMPLES.DIALOG.SURE_DEACTIVATE' },
      });
      expect(sampleTrackingService.putLabResult).toHaveBeenCalledOnceWith(
        'Testproband',
        '1',
        {
          status: 'inactive',
        }
      );
    }));

    it('should not update and show info dialog', async () => {
      // Arrange
      const row = {
        ...createLabResult({ status: 'analyzed' }),
        pendingDeletionObject: null,
      };

      // Act
      await component.onDeactivateRow(row);

      // Assert
      expect(sampleTrackingService.putLabResult).not.toHaveBeenCalled();
      expect(dialog.open).toHaveBeenCalledWith(DialogInfoComponent, {
        width: '300px',
        data: { content: 'SAMPLES.DIALOG.CANNOT_DEACTIVATE' },
      });
    });
  });

  function createComponent(): void {
    // Create component
    fixture = MockRender(SamplesComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }
});
