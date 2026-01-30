/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import SpyObj = jasmine.SpyObj;

import { QuestionnaireAnswerSampleComponent } from './questionnaire-answer-sample.component';
import { SampleTrackingClientService } from '../../lab-result/sample-tracking-client.service';
import { BackButtonService } from '../../shared/services/back-button/back-button.service';

describe('QuestionnaireAnswerSampleComponent', () => {
  let component: QuestionnaireAnswerSampleComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerSampleComponent>;

  let sampleTrackingClient: SpyObj<SampleTrackingClientService>;
  let alertCtrl: SpyObj<AlertController>;
  let backButton: SpyObj<BackButtonService>;

  beforeEach(() => {
    sampleTrackingClient = jasmine.createSpyObj('SampleTrackingClientService', [
      'putSampleAnswer',
    ]);
    alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    backButton = jasmine.createSpyObj('BackButtonService', [
      'enable',
      'disable',
    ]);

    TestBed.configureTestingModule({
      imports: [QuestionnaireAnswerSampleComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: SampleTrackingClientService,
          useValue: sampleTrackingClient,
        },
        { provide: AlertController, useValue: alertCtrl },
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
