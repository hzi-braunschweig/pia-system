/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LoadingController, MenuController } from '@ionic/angular';
import { MockBuilder } from 'ng-mocks';

import { CompliancePage } from './compliance.page';
import { ComplianceClientService } from './compliance-client/compliance-client.service';
import { ComplianceService } from './compliance-service/compliance.service';
import { ToastPresenterService } from '../shared/services/toast-presenter/toast-presenter.service';
import {
  ComplianceData,
  ComplianceDataRequest,
  ComplianceDataResponse,
} from './compliance.model';
import { SegmentType } from './segment.model';
import { CompliancePageModule } from './compliance.page.module';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.service';
import SpyObj = jasmine.SpyObj;

describe('CompliancePage', () => {
  let component: CompliancePage;
  let fixture: ComponentFixture<CompliancePage>;

  let complianceClient: SpyObj<ComplianceClientService>;
  let complianceService: SpyObj<ComplianceService>;
  let translateService: SpyObj<TranslateService>;
  let loadingCtrl: SpyObj<LoadingController>;
  let toastPresenter: SpyObj<ToastPresenterService>;
  let menuCtrl: SpyObj<MenuController>;
  let router: SpyObj<Router>;
  let activatedRoute;
  let currentUser: SpyObj<CurrentUser>;

  const testStudyName = 'Teststudie';
  const complianceText =
    '<pia-consent-input-text-firstname></pia-consent-input-text-firstname><pia-consent-input-text-lastname></pia-consent-input-text-lastname><pia-consent-input-text-birthdate></pia-consent-input-text-birthdate><pia-consent-input-text-location></pia-consent-input-text-location> <pia-consent-input-radio-app></pia-consent-input-radio-app><pia-consent-input-radio-bloodsamples></pia-consent-input-radio-bloodsamples><pia-consent-input-radio-labresults></pia-consent-input-radio-labresults><pia-consent-input-radio-samples></pia-consent-input-radio-samples>';

  beforeEach(async () => {
    // Provider and Services
    translateService = jasmine.createSpyObj<TranslateService>(
      'TranslateService',
      ['instant']
    );
    complianceClient = jasmine.createSpyObj<ComplianceClientService>(
      'ComplianceClientService',
      ['getComplianceText', 'getComplianceAgreementPdfForCurrentUser']
    );
    complianceService = jasmine.createSpyObj<ComplianceService>(
      'ComplianceService',
      [
        'getComplianceAgreementForCurrentUser',
        'updateComplianceAgreementForCurrentUser',
      ]
    );
    loadingCtrl = jasmine.createSpyObj<LoadingController>('LoadingController', [
      'create',
    ]);
    toastPresenter = jasmine.createSpyObj<ToastPresenterService>(
      'ToastPresenterService',
      ['presentToast']
    );
    menuCtrl = jasmine.createSpyObj<MenuController>('MenuController', [
      'enable',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    activatedRoute = {
      snapshot: { queryParamMap: convertToParamMap({ returnTo: 'home' }) },
    };
    currentUser = jasmine.createSpyObj<CurrentUser>([], {
      study: testStudyName,
    });

    // Build Base Module
    await MockBuilder(CompliancePage, [CompliancePageModule, ActivatedRoute])
      .mock(ToastPresenterService, toastPresenter)
      .mock(Router, router)
      .mock(ActivatedRoute, activatedRoute)
      .mock(ComplianceService, complianceService)
      .mock(LoadingController, loadingCtrl)
      .mock(ComplianceClientService, complianceClient)
      .mock(MenuController, menuCtrl)
      .mock(CurrentUser, currentUser);
  });

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component
    complianceClient.getComplianceText.and.resolveTo({
      compliance_text: complianceText,
      compliance_text_object: [],
    });
    complianceService.getComplianceAgreementForCurrentUser.and.resolveTo(
      createComplianceDataResponse()
    );
    const loading = jasmine.createSpyObj<HTMLIonLoadingElement>([
      'present',
      'dismiss',
    ]);
    loading.present.and.returnValue(Promise.resolve(null));
    loading.dismiss.and.returnValue(Promise.resolve(null));
    loadingCtrl.create.and.resolveTo(loading);

    // Create component
    fixture = TestBed.createComponent(CompliancePage);
    component = fixture.componentInstance;
    component.ionViewWillEnter();
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }));

  describe('ionViewWillEnter()', () => {
    it('should request the primary study and save its name', () => {
      expect(component.studyName).toEqual(testStudyName);
      expect(toastPresenter.presentToast).not.toHaveBeenCalled();
    });

    it('should request the studies compliance data', () => {
      expect(
        complianceService.getComplianceAgreementForCurrentUser
      ).toHaveBeenCalled();
      expect(component.studyWrapper.complianceTextObject).toEqual([
        { type: SegmentType.HTML, html: 'test' },
      ]);
      expect(toastPresenter.presentToast).not.toHaveBeenCalled();
    });

    it('should request the compliance text if no compliance data exist', async () => {
      complianceService.getComplianceAgreementForCurrentUser.and.returnValue(
        null
      );
      await component.ionViewWillEnter();
      expect(complianceClient.getComplianceText).toHaveBeenCalledWith(
        testStudyName
      );
      expect(component.studyWrapper.complianceText).toEqual(complianceText);
    });
  });

  describe('submitCompliance()', () => {
    beforeEach(async () => {
      complianceService.getComplianceAgreementForCurrentUser.and.resolveTo(
        null
      );
      await component.ionViewWillEnter();
      expect(complianceClient.getComplianceText).toHaveBeenCalledWith(
        testStudyName
      );
      component.studyWrapper.setComplianceData(createComplianceDataResponse());
      component.studyWrapper.usedFormControls = createUsedFormControlsMap();
    });

    it('should update compliance data from formGroup', fakeAsync(() => {
      complianceService.updateComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse()
      );
      component.submitCompliance();
      tick();
      expect(
        complianceService.updateComplianceAgreementForCurrentUser
      ).toHaveBeenCalledWith(createComplianceDataRequest());
    }));

    it('should enable the menu if app compliance was given', fakeAsync(() => {
      complianceService.updateComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse(true)
      );
      component.submitCompliance();
      tick();
      expect(menuCtrl.enable).toHaveBeenCalledWith(true);
    }));

    it('should disable the menu if app compliance was not given', fakeAsync(() => {
      complianceService.updateComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse(false)
      );
      component.submitCompliance();
      tick();
      expect(menuCtrl.enable).toHaveBeenCalledWith(false);
    }));

    it('should return to HomePage if app compliance was given', fakeAsync(() => {
      complianceService.updateComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse(true)
      );
      component.submitCompliance();
      tick();
      expect(router.navigate).toHaveBeenCalledWith(['home']);
    }));
  });

  describe('downloadCompliance()', () => {
    it('should call compliance service to open the compliances PDF', () => {
      component.downloadCompliance();
      expect(
        complianceClient.getComplianceAgreementPdfForCurrentUser
      ).toHaveBeenCalledWith(testStudyName);
    });
  });

  function createComplianceDataRequest(
    appCompliance: boolean = true
  ): ComplianceDataRequest {
    return {
      compliance_text: complianceText,
      ...createComplianceData(appCompliance),
    };
  }

  function createComplianceDataResponse(
    appCompliance: boolean = true
  ): ComplianceDataResponse {
    return {
      compliance_text_object: [{ type: SegmentType.HTML, html: 'test' }],
      timestamp: new Date(),
      ...createComplianceData(appCompliance),
    };
  }

  function createComplianceData(appCompliance: boolean = true): ComplianceData {
    return {
      textfields: {
        firstname: 'heiko',
        lastname: 'schotte',
        birthdate: new Date('1968-03-12'),
        location: 'Muster-Stadt',
      },
      compliance_system: {
        app: appCompliance,
        samples: false,
        bloodsamples: true,
        labresults: true,
      },
      compliance_questionnaire: [{ name: 'world-domination', value: true }],
    };
  }

  function createUsedFormControlsMap(): Map<string, string[]> {
    return new Map([
      ['["consentSystem","app"]', ['consentSystem', 'app']],
      ['["consentSystem","samples"]', ['consentSystem', 'samples']],
      ['["consentSystem","bloodsamples"]', ['consentSystem', 'bloodsamples']],
      ['["consentSystem","labresults"]', ['consentSystem', 'labresults']],
      ['["textSystem","date"]', ['textSystem', 'date']],
      ['["textSystem","firstname"]', ['textSystem', 'firstname']],
      ['["textSystem","lastname"]', ['textSystem', 'lastname']],
      ['["textSystem","birthdate"]', ['textSystem', 'birthdate']],
      ['["textSystem","location"]', ['textSystem', 'location']],
      [
        '["consentGeneric","world-domination"]',
        ['consentGeneric', 'world-domination'],
      ],
    ]);
  }
});
