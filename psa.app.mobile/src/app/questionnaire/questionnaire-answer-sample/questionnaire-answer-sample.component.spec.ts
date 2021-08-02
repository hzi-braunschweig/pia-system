/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertController, IonicModule } from '@ionic/angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;

import { QuestionnaireAnswerSampleComponent } from './questionnaire-answer-sample.component';
import { SampleTrackingClientService } from '../../lab-result/sample-tracking-client.service';
import { BackButtonService } from '../../shared/services/back-button/back-button.service';

describe('QuestionnaireAnswerSampleComponent', () => {
  let component: QuestionnaireAnswerSampleComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerSampleComponent>;

  let sampleTrackingClient: SpyObj<SampleTrackingClientService>;
  let barcodeScanner: SpyObj<BarcodeScanner>;
  let alertCtrl: SpyObj<AlertController>;
  let translate: SpyObj<TranslateService>;
  let keyboard: SpyObj<Keyboard>;
  let backButton: SpyObj<BackButtonService>;

  beforeEach(() => {
    sampleTrackingClient = jasmine.createSpyObj('SampleTrackingClientService', [
      'putSampleAnswer',
    ]);
    barcodeScanner = jasmine.createSpyObj('BarcodeScanner', ['scan']);
    alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    translate = jasmine.createSpyObj('TranslateService', ['instant']);
    keyboard = jasmine.createSpyObj('Keyboard', ['hide']);
    backButton = jasmine.createSpyObj('BackButtonService', [
      'enable',
      'disable',
    ]);

    TestBed.configureTestingModule({
      declarations: [
        QuestionnaireAnswerSampleComponent,
        MockPipe(TranslatePipe),
      ],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: SampleTrackingClientService,
          useValue: sampleTrackingClient,
        },
        { provide: BarcodeScanner, useValue: barcodeScanner },
        { provide: AlertController, useValue: alertCtrl },
        { provide: TranslateService, useValue: translate },
        { provide: Keyboard, useValue: keyboard },
        { provide: BackButtonService, useValue: backButton },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerSampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
