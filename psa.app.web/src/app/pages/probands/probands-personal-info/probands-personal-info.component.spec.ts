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
import SpyObj = jasmine.SpyObj;

describe('ProbandsPersonalInfoComponent', () => {
  let fixture: MockedComponentFixture;
  let component: ProbandsPersonalInfoComponent;
  let queryParamMap: Map<string, string>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let authService: SpyObj<AuthService>;
  let alertService: SpyObj<AlertService>;
  let personalDataService: SpyObj<PersonalDataService>;
  let probandService: SpyObj<ProbandService>;

  beforeEach(async () => {
    // Provider and Services
    queryParamMap = new Map();
    questionnaireService = jasmine.createSpyObj(QuestionnaireService, [
      'getStudies',
    ]);
    authService = jasmine.createSpyObj(AuthService, [
      'getPendingDeletionForProbandId',
      'getPendingComplianceChange',
    ]);
    personalDataService = jasmine.createSpyObj(PersonalDataService, [
      'getPendingDeletionForProbandId',
      'getPersonalDataAll',
      'getPendingPersonalDataDeletions',
    ]);
    probandService = jasmine.createSpyObj(ProbandService, [
      'getProbands',
      'getPendingComplianceChanges',
      'getPendingProbandDeletions',
    ]);
    alertService = jasmine.createSpyObj(AlertService, ['errorObject']);
    alertService.errorObject.and.callFake(console.error);

    questionnaireService.getStudies.and.resolveTo({
      studies: [
        createStudy({ name: 'study1' }),
        createStudy({ name: 'study2' }),
      ],
    });

    // Build Base Module
    await MockBuilder(ProbandsPersonalInfoComponent, AppModule)
      .provide({
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap } },
      })
      .keep(MatFormFieldModule)
      .keep(MatInputModule)
      .keep(MatPaginatorModule)
      .keep(MatSortModule)
      .mock(ProbandService, probandService)
      .mock(QuestionnaireService, questionnaireService)
      .mock(AuthService, authService)
      .mock(AlertService, alertService)
      .mock(PersonalDataService, personalDataService);
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
});
