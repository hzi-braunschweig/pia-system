/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BreakpointObserver } from '@angular/cdk/layout';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from 'src/app/app.module';
import { fakeAsync, tick } from '@angular/core/testing';
import { ProbandsPersonalInfoComponent } from './probands-personal-info.component';
import { ActivatedRoute } from '@angular/router';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { PersonalDataService } from '../../../psa.app.core/providers/personaldata-service/personaldata-service';
import { ProbandService } from '../../../psa.app.core/providers/proband-service/proband.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  createPendingComplianceChange,
  createPendingPersonalDataDeletion,
  createPendingProbandDeletion,
  createPersonalData,
  createProband,
  createStudy,
} from '../../../psa.app.core/models/instance.helper.spec';
import { AlertService } from '../../../_services/alert.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { DialogDeletePartnerComponent } from '../../../_helpers/dialog-delete-partner';
import { Proband } from '../../../psa.app.core/models/proband';
import { DialogChangeComplianceComponent } from '../../../_helpers/dialog-change-compliance';
import { CurrentUser } from '../../../_services/current-user.service';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import SpyObj = jasmine.SpyObj;
import { By } from '@angular/platform-browser';

describe('ProbandsPersonalInfoComponent', () => {
  let fixture: MockedComponentFixture;
  let component: ProbandsPersonalInfoComponent;
  let queryParamMap: Map<string, string>;
  let matDialog: SpyObj<MatDialog>;
  let userService: SpyObj<UserService>;
  let authService: SpyObj<AuthService>;
  let alertService: SpyObj<AlertService>;
  let personalDataService: SpyObj<PersonalDataService>;
  let probandService: SpyObj<ProbandService>;
  let afterClosedSubject: Subject<string>;
  let currentUser: SpyObj<CurrentUser>;
  let datePipe: SpyObj<DatePipe>;
  let translate: SpyObj<TranslateService>;

  beforeEach(async () => {
    // Provider and Services
    queryParamMap = new Map();
    afterClosedSubject = new Subject();
    matDialog = jasmine.createSpyObj('MatDialog', ['open']);
    matDialog.open.and.returnValue({
      afterClosed: () => afterClosedSubject.asObservable(),
    } as MatDialogRef<unknown>);
    userService = jasmine.createSpyObj(UserService, ['getStudies']);
    authService = jasmine.createSpyObj(AuthService, [
      'getPendingDeletionForProbandId',
      'getPendingComplianceChange',
      'getProband',
      'deletePendingDeletion',
      'deletePendingComplianceChange',
    ]);
    personalDataService = jasmine.createSpyObj('PersonalDataService', [
      'getPendingDeletionForProbandId',
      'getPersonalDataAll',
      'getPendingPersonalDataDeletions',
      'deletePendingDeletion',
    ]);
    probandService = jasmine.createSpyObj('ProbandService', [
      'getProbands',
      'getPendingComplianceChanges',
      'getPendingProbandDeletions',
      'getProbandsExport',
    ]);
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    alertService.errorObject.and.callFake(console.error);
    userService.getStudies.and.resolveTo([
      createStudy({ name: 'study1' }),
      createStudy({ name: 'study2' }),
    ]);
    currentUser = jasmine.createSpyObj<CurrentUser>('CurrentUser', [], {
      username: 'SomeProfessional',
    });

    datePipe = jasmine.createSpyObj('DatePipe', ['transform']);
    datePipe.transform.and.returnValue('28-07-2020');
    translate = jasmine.createSpyObj('TranslateService', ['instant']);
    translate.instant.and.callFake((value) => value);

    // Build Base Module
    await MockBuilder(ProbandsPersonalInfoComponent, AppModule)
      .provide({ provide: DatePipe, useValue: datePipe })
      .provide({
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap } },
      })
      .keep(MatFormFieldModule)
      .keep(MatInputModule)
      .keep(MatPaginatorModule)
      .keep(BreakpointObserver)
      .keep(MatSortModule)
      .mock(CurrentUser, currentUser)
      .mock(MatDialog, matDialog)
      .mock(ProbandService, probandService)
      .mock(UserService, userService)
      .mock(AuthService, authService)
      .mock(AlertService, alertService)
      .mock(PersonalDataService, personalDataService)
      .mock(TranslateService, translate);
  });

  describe('with no params', () => {
    const pseudonym = 'TEST-0001';
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      userService.getStudies.and.resolveTo([createStudy({ name: 'study1' })]);
      probandService.getProbands.and.resolveTo([
        createProband({ pseudonym }),
        createProband({ pseudonym: 'test-0002', ids: 'TEST-0002' }),
      ]);
      personalDataService.getPersonalDataAll.and.resolveTo([
        createPersonalData({ pseudonym }),
      ]);
      probandService.getPendingComplianceChanges.and.resolveTo([
        createPendingComplianceChange({ proband_id: pseudonym }),
      ]);
      probandService.getPendingProbandDeletions.and.resolveTo([
        createPendingProbandDeletion({ for_id: pseudonym }),
      ]);
      personalDataService.getPendingPersonalDataDeletions.and.resolveTo([
        createPendingPersonalDataDeletion({ proband_id: pseudonym }),
      ]);

      // Create component
      fixture = MockRender(ProbandsPersonalInfoComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
      fixture.detectChanges();
    }));

    it('should create the component and load the probands of the one study', () => {
      expect(component).toBeDefined();
      expect(userService.getStudies).toHaveBeenCalled();
      expect(alertService.errorObject).not.toHaveBeenCalled();
    });

    describe('export proband data', () => {
      it('should export the proband data if download button is clicked', () => {
        const downloadButton = fixture.debugElement.query(
          By.css('[data-e2e="download-probands-button"]')
        );
        probandService.getProbandsExport.and.returnValue(
          Promise.resolve({ probandsExport: 'test' })
        );

        downloadButton.nativeElement.click();
        expect(probandService.getProbandsExport).toHaveBeenCalledOnceWith(
          'study1'
        );
      });

      it('should throw an error if no study is selected', async () => {
        component.currentStudy = null;
        await expectAsync(component.downloadProbandsOfStudy()).toBeRejectedWith(
          new Error('No study selected')
        );
      });
    });
  });

  describe('pending personal data deletion', () => {
    const pseudonym = 'TEST-0001';
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMap.set('probandIdToDelete', '1234');
      queryParamMap.set('type', 'personal');
      personalDataService.getPendingDeletionForProbandId.and.resolveTo(
        createPendingPersonalDataDeletion({
          requested_for: 'Test-PM2',
          requested_by: 'Test-PM1',
          proband_id: pseudonym,
          study: 'Teststudy',
        })
      );

      // Create component
      fixture = MockRender(ProbandsPersonalInfoComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
      fixture.detectChanges();
    }));

    it('should open the personal data deletion dialog', () => {
      expect(matDialog.open).toHaveBeenCalledOnceWith(
        DialogDeletePartnerComponent,
        {
          width: '400px',
          data: {
            usernames: {
              usernameProband: pseudonym,
              usernamePM: 'Test-PM1',
            },
            type: 'personal',
            pendingdeletionId: 1,
            affectedStudy: 'Teststudy',
          },
        }
      );
    });
  });

  describe('pending proband deletion', () => {
    const pseudonym = 'TEST-0001';
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMap.set('probandIdToDelete', pseudonym);
      queryParamMap.set('type', 'general');
      authService.getPendingDeletionForProbandId.and.resolveTo(
        createPendingProbandDeletion({
          requested_for: 'Test-PM2',
          requested_by: 'Test-PM1',
          for_id: pseudonym,
        })
      );
      authService.getProband.and.resolveTo({
        study: 'Teststudy',
      } as Proband);

      // Create component
      fixture = MockRender(ProbandsPersonalInfoComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
      fixture.detectChanges();
    }));

    it('should open the proband deletion dialog', () => {
      expect(matDialog.open).toHaveBeenCalledOnceWith(
        DialogDeletePartnerComponent,
        {
          width: '400px',
          data: {
            usernames: {
              usernameProband: pseudonym,
              usernamePM: 'Test-PM1',
            },
            type: 'general',
            pendingdeletionId: 1,
            affectedStudy: 'Teststudy',
          },
        }
      );
    });
  });

  describe('pending compliance change', () => {
    const complianceChangeId = 1;
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMap.set(
        'pendingComplianceChangeId',
        complianceChangeId.toString()
      );
      authService.getPendingComplianceChange.and.resolveTo(
        createPendingComplianceChange({
          requested_for: 'Test-UT2',
          requested_by: 'Test-UT1',
          proband_id: 'Test-1234',
          id: complianceChangeId,
        })
      );

      // Create component
      fixture = MockRender(ProbandsPersonalInfoComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
      fixture.detectChanges();
    }));

    it('should open the compliance change dialog', () => {
      expect(matDialog.open).toHaveBeenCalledOnceWith(
        DialogChangeComplianceComponent,
        {
          width: '400px',
          data: {
            has_four_eyes_opposition: true,
            usernameProband: 'Test-1234',
            compliance_labresults: false,
            compliance_samples: false,
            compliance_bloodsamples: false,
            requested_by: 'Test-UT1',
            requested_for: 'SomeProfessional',
            deletePendingComplianceChangeId: complianceChangeId,
          },
        }
      );
    });
  });

  describe('cancelTotalOpposition()', () => {
    beforeEach(fakeAsync(() => {
      // Create component
      fixture = MockRender(ProbandsPersonalInfoComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
      fixture.detectChanges();
    }));

    it('should cancel a pending deletion after successful confirmation', fakeAsync(() => {
      component.cancelTotalOpposition(1, 'TEST-1234');
      afterClosedSubject.next('yes');
      tick();
      expect(authService.deletePendingDeletion).toHaveBeenCalledOnceWith(1);
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'DIALOG.DELETION_REJECTED_PROBAND',
          values: { for_id: 'TEST-1234' },
          isSuccess: true,
        },
      });
    }));

    it('should show an error if cancellation fails', fakeAsync(() => {
      authService.deletePendingDeletion.and.rejectWith('some error occurred');
      component.cancelTotalOpposition(1, 'TEST-1234');
      afterClosedSubject.next('yes');
      tick();
      expect(authService.deletePendingDeletion).toHaveBeenCalledOnceWith(1);
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'DIALOG.ERROR_DELETE_REJECT',
          isSuccess: false,
        },
      });
    }));
  });

  describe('cancelCommunicationBan()', () => {
    beforeEach(fakeAsync(() => {
      // Create component
      fixture = MockRender(ProbandsPersonalInfoComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
      fixture.detectChanges();
    }));

    it('should cancel a pending communication ban after successful confirmation', fakeAsync(() => {
      component.cancelCommunicationBan('TEST-1234');
      afterClosedSubject.next('yes');
      tick();
      expect(
        personalDataService.deletePendingDeletion
      ).toHaveBeenCalledOnceWith('TEST-1234');
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'DIALOG.DELETION_REJECTED_PROBAND',
          values: { for_id: 'TEST-1234' },
          isSuccess: true,
        },
      });
    }));

    it('should show an error if a cancellation fails', fakeAsync(() => {
      personalDataService.deletePendingDeletion.and.rejectWith(
        'some error occurred'
      );
      component.cancelCommunicationBan('TEST-1234');
      afterClosedSubject.next('yes');
      tick();
      expect(
        personalDataService.deletePendingDeletion
      ).toHaveBeenCalledOnceWith('TEST-1234');
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'DIALOG.ERROR_DELETE_REJECT',
          isSuccess: false,
        },
      });
    }));
  });

  describe('cancelPendingComplianceChange()', () => {
    beforeEach(fakeAsync(() => {
      // Create component
      fixture = MockRender(ProbandsPersonalInfoComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
      fixture.detectChanges();
    }));

    it('should cancel a pending compliance change after successful confirmation', fakeAsync(() => {
      component.cancelPendingComplianceChange(1, 'TEST-1234');
      afterClosedSubject.next('yes');
      tick();
      expect(
        authService.deletePendingComplianceChange
      ).toHaveBeenCalledOnceWith(1);
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'PROBANDEN.CHANGE_COMPLIANCES_REJECTED',
          values: { probandUsername: 'TEST-1234' },
          isSuccess: true,
        },
      });
    }));

    it('should show an error if cancellation fails', fakeAsync(() => {
      authService.deletePendingComplianceChange.and.rejectWith(
        'some error occurred'
      );
      component.cancelPendingComplianceChange(1, 'TEST-1234');
      afterClosedSubject.next('yes');
      tick();
      expect(
        authService.deletePendingComplianceChange
      ).toHaveBeenCalledOnceWith(1);
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'DIALOG.ERROR_COMPLIANCE_REQUEST',
          isSuccess: false,
        },
      });
    }));
  });

  describe('getTranslatedAccountStatusTooltipText()', () => {
    beforeEach(fakeAsync(() => {
      // Create component
      fixture = MockRender(ProbandsPersonalInfoComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
      fixture.detectChanges();
    }));

    it('should return a translated tooltip text for deactivated probands', () => {
      // Arrange
      const proband = createProband({
        pseudonym: 'TEST-0001',
        status: 'deactivated',
        deactivatedAt: '2020-07-28T00:00:00.000Z',
      });

      // Act
      const result = component.getTranslatedAccountStatusTooltipText(proband);

      // Assert
      expect(result).toEqual('PROBANDEN.ACCOUNT_STATUS_DEACTIVATED_AT');
      expect(translate.instant).toHaveBeenCalledWith(
        'PROBANDEN.ACCOUNT_STATUS_DEACTIVATED_AT',
        {
          deactivatedAt: '28-07-2020',
        }
      );
    });

    it('should return a translated tooltip text for deleted probands', () => {
      // Arrange
      const proband = createProband({
        pseudonym: 'TEST-0001',
        status: 'deleted',
        deletedAt: '2020-07-28T00:00:00.000Z',
      });

      // Act
      const result = component.getTranslatedAccountStatusTooltipText(proband);

      // Assert
      expect(result).toEqual('PROBANDEN.ACCOUNT_STATUS_DELETED_AT');
      expect(translate.instant).toHaveBeenCalledWith(
        'PROBANDEN.ACCOUNT_STATUS_DELETED_AT',
        {
          deletedAt: '28-07-2020',
        }
      );
    });
  });
});
