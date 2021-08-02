/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LoadingController, MenuController } from '@ionic/angular';
import { MockPipe } from 'ng-mocks';

import { CompliancePage } from './compliance.page';
import { PrimaryStudyService } from '../shared/services/primary-study/primary-study.service';
import { ComplianceClientService } from './compliance-client/compliance-client.service';
import { ComplianceService } from './compliance-service/compliance.service';
import { ToastPresenterService } from '../shared/services/toast-presenter/toast-presenter.service';
import { Study } from '../questionnaire/questionnaire.model';
import {
  ComplianceData,
  ComplianceDataRequest,
  ComplianceDataResponse,
} from './compliance.model';
import { SegmentType } from './segment.model';
import SpyObj = jasmine.SpyObj;

describe('CompliancePage', () => {
  let component: CompliancePage;
  let fixture: ComponentFixture<CompliancePage>;

  let primaryStudyService: SpyObj<PrimaryStudyService>;
  let complianceClient: SpyObj<ComplianceClientService>;
  let complianceService: SpyObj<ComplianceService>;
  let translateService: SpyObj<TranslateService>;
  let loadingCtrl: SpyObj<LoadingController>;
  let toastPresenter: SpyObj<ToastPresenterService>;
  let menuCtrl: SpyObj<MenuController>;
  let router: SpyObj<Router>;
  let loading: SpyObj<HTMLIonLoadingElement>;
  let activatedRoute;

  let formGroup: FormGroup;
  const testStudyName = 'Teststudie';
  const complianceText =
    '<pia-consent-input-text-firstname></pia-consent-input-text-firstname><pia-consent-input-text-lastname></pia-consent-input-text-lastname><pia-consent-input-text-birthdate></pia-consent-input-text-birthdate><pia-consent-input-text-location></pia-consent-input-text-location> <pia-consent-input-radio-app></pia-consent-input-radio-app><pia-consent-input-radio-bloodsamples></pia-consent-input-radio-bloodsamples><pia-consent-input-radio-labresults></pia-consent-input-radio-labresults><pia-consent-input-radio-samples></pia-consent-input-radio-samples>';

  beforeEach(() => {
    translateService = jasmine.createSpyObj('TranslateService', ['instant']);
    primaryStudyService = jasmine.createSpyObj('PrimaryStudyService', [
      'getPrimaryStudy',
    ]);
    complianceClient = jasmine.createSpyObj('ComplianceClientService', [
      'getComplianceText',
      'getComplianceAgreementPdfForCurrentUser',
    ]);
    complianceService = jasmine.createSpyObj('ComplianceService', [
      'getComplianceAgreementForCurrentUser',
      'updateComplianceAgreementForCurrentUser',
    ]);
    loadingCtrl = jasmine.createSpyObj('LoadingController', ['create']);
    toastPresenter = jasmine.createSpyObj('ToastPresenter', ['presentToast']);
    menuCtrl = jasmine.createSpyObj('MenuController', ['enable']);
    loading = jasmine.createSpyObj('Loading', ['present', 'dismiss']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    activatedRoute = {
      snapshot: { queryParamMap: jasmine.createSpyObj('ParamMap', ['get']) },
    };

    formGroup = createFormGroup();

    primaryStudyService.getPrimaryStudy.and.returnValue(
      Promise.resolve({ name: testStudyName } as Study)
    );
    complianceClient.getComplianceText.and.returnValue(
      Promise.resolve({
        compliance_text: complianceText,
        compliance_text_object: [],
      })
    );
    complianceService.getComplianceAgreementForCurrentUser.and.returnValue(
      Promise.resolve(createComplianceDataResponse())
    );
    loading.present.and.returnValue(Promise.resolve(null));
    loading.dismiss.and.returnValue(Promise.resolve(null));
    loadingCtrl.create.and.returnValue(Promise.resolve(loading));
    activatedRoute.snapshot.queryParamMap.get.and.returnValue('home');

    TestBed.configureTestingModule({
      declarations: [
        MockPipe(TranslatePipe, (...args: string[]) => JSON.stringify(args)),
        CompliancePage,
      ],
      providers: [
        { provide: TranslateService, useValue: translateService },
        { provide: PrimaryStudyService, useValue: primaryStudyService },
        { provide: ComplianceClientService, useValue: complianceClient },
        { provide: ComplianceService, useValue: complianceService },
        { provide: LoadingController, useValue: loadingCtrl },
        { provide: ToastPresenterService, useValue: toastPresenter },
        { provide: MenuController, useValue: menuCtrl },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(CompliancePage);
    component = fixture.componentInstance;
    await component.ionViewWillEnter();
  });

  describe('ionViewWillEnter()', () => {
    it('should request the primary study and save its name', () => {
      expect(primaryStudyService.getPrimaryStudy).toHaveBeenCalledTimes(1);
      expect(component.studyName).toEqual(testStudyName);
      expect(toastPresenter.presentToast).not.toHaveBeenCalled();
    });

    it('should request the studies compliance data', () => {
      expect(
        complianceService.getComplianceAgreementForCurrentUser
      ).toHaveBeenCalledWith(testStudyName);
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
      component.studyWrapper.setComplianceData(createComplianceDataResponse());
      component.studyWrapper.usedFormControls = createUsedFormControlsMap();
    });

    it('should update compliance data from formGroup', async () => {
      complianceService.updateComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse()
      );
      await component.submitCompliance();
      expect(
        complianceService.updateComplianceAgreementForCurrentUser
      ).toHaveBeenCalledWith(createComplianceDataRequest(), testStudyName);
    });

    it('should enable the menu if app compliance was given', async (done) => {
      complianceService.updateComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse(true)
      );
      await component.submitCompliance();
      setTimeout(() => {
        expect(menuCtrl.enable).toHaveBeenCalledWith(true);
        done();
      }, 3000);
    });

    it('should disable the menu if app compliance was not given', async (done) => {
      complianceService.updateComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse(false)
      );
      await component.submitCompliance();
      setTimeout(() => {
        expect(menuCtrl.enable).toHaveBeenCalledWith(false);
        done();
      }, 3000);
    });

    it('should return to HomePage if app compliance was given', async (done) => {
      complianceService.updateComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse(true)
      );
      await component.submitCompliance();
      setTimeout(() => {
        expect(router.navigate).toHaveBeenCalledWith(['home']);
        done();
      }, 3000);
    });
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

  function createFormGroup(): FormGroup {
    return new FormGroup({
      textfields: new FormGroup({
        firstname: new FormControl('Barney'),
        location: new FormControl('Muster-Stadt'),
        lastname: new FormControl('Geröllheimer'),
        birthdate: new FormControl('1960-01-01'),
      }),
      compliance_system: new FormGroup({
        app: new FormControl(null),
        bloodsamples: new FormControl(null),
        labresults: new FormControl(null),
        samples: new FormControl(null),
      }),
    });
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
