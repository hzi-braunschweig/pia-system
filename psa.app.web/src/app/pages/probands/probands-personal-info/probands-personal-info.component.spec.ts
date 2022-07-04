/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from 'src/app/app.module';
import { fakeAsync, tick } from '@angular/core/testing';
import { ProbandsPersonalInfoComponent } from './probands-personal-info.component';
import { ActivatedRoute } from '@angular/router';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { PersonalDataService } from '../../../psa.app.core/providers/personaldata-service/personaldata-service';
import { ProbandService } from '../../../psa.app.core/providers/proband-service/proband.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  createPendingComplianceChange,
  createPendingPersonalDataDeletion,
  createPendingProbandDeletion,
  createPersonalData,
  createProbandNew,
  createStudy,
} from '../../../psa.app.core/models/instance.helper.spec';
import { AlertService } from '../../../_services/alert.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import SpyObj = jasmine.SpyObj;

describe('ProbandsPersonalInfoComponent', () => {
  let fixture: MockedComponentFixture;
  let component: ProbandsPersonalInfoComponent;
  let queryParamMap: Map<string, string>;
  let matDialog: SpyObj<MatDialog>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let authService: SpyObj<AuthService>;
  let alertService: SpyObj<AlertService>;
  let personalDataService: SpyObj<PersonalDataService>;
  let probandService: SpyObj<ProbandService>;
  let afterClosedSubject: Subject<string>;
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
    questionnaireService = jasmine.createSpyObj('QuestionnaireService', [
      'getStudies',
    ]);
    authService = jasmine.createSpyObj('AuthService', [
      'getPendingDeletionForProbandId',
      'getPendingComplianceChange',
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
    ]);
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    alertService.errorObject.and.callFake(console.error);

    questionnaireService.getStudies.and.resolveTo({
      studies: [
        createStudy({ name: 'study1' }),
        createStudy({ name: 'study2' }),
      ],
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
      .keep(MatSortModule)
      .mock(MatDialog, matDialog)
      .mock(ProbandService, probandService)
      .mock(QuestionnaireService, questionnaireService)
      .mock(AuthService, authService)
      .mock(AlertService, alertService)
      .mock(PersonalDataService, personalDataService)
      .mock(TranslateService, translate);
  });

  describe('with no params', () => {
    const pseudonym = 'TEST-0001';
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      questionnaireService.getStudies.and.resolveTo({
        studies: [createStudy({ name: 'study1' })],
      });
      probandService.getProbands.and.resolveTo([
        createProbandNew({ pseudonym }),
        createProbandNew({ pseudonym: 'TEST-0002' }),
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
      expect(questionnaireService.getStudies).toHaveBeenCalled();
      expect(alertService.errorObject).not.toHaveBeenCalled();
    });
  });

  describe('pending personal data deletion', () => {
    const pseudonym = 'TEST-0001';
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMap.set('probandIdToDelete', pseudonym);
      queryParamMap.set('type', 'personal');
      personalDataService.getPendingDeletionForProbandId.and.resolveTo(
        createPendingPersonalDataDeletion({ proband_id: pseudonym })
      );

      // Create component
      fixture = MockRender(ProbandsPersonalInfoComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
      fixture.detectChanges();
    }));

    it('should create the component', () => {
      expect(component).toBeDefined();
      expect(alertService.errorObject).not.toHaveBeenCalled();
    });
  });

  describe('pending proband deletion', () => {
    const pseudonym = 'TEST-0001';
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMap.set('probandIdToDelete', pseudonym);
      queryParamMap.set('type', 'general');
      authService.getPendingDeletionForProbandId.and.resolveTo(
        createPendingProbandDeletion({ for_id: pseudonym })
      );

      // Create component
      fixture = MockRender(ProbandsPersonalInfoComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
      fixture.detectChanges();
    }));

    it('should create the component', () => {
      expect(component).toBeDefined();
      expect(alertService.errorObject).not.toHaveBeenCalled();
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
        createPendingComplianceChange({ id: complianceChangeId })
      );

      // Create component
      fixture = MockRender(ProbandsPersonalInfoComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
      fixture.detectChanges();
    }));

    it('should create the component', () => {
      expect(component).toBeDefined();
      expect(alertService.errorObject).not.toHaveBeenCalled();
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
      const proband = createProbandNew({
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
      const proband = createProbandNew({
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
