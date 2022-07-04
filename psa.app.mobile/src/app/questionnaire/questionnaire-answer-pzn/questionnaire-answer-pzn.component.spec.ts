/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Keyboard } from '@awesome-cordova-plugins/keyboard/ngx';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { TranslatePipe } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;

import { QuestionnaireAnswerPznComponent } from './questionnaire-answer-pzn.component';
import { BackButtonService } from '../../shared/services/back-button/back-button.service';

describe('QuestionnaireAnswerPznComponent', () => {
  let component: QuestionnaireAnswerPznComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerPznComponent>;

  let barcodeScanner: SpyObj<BarcodeScanner>;
  let keyboard: SpyObj<Keyboard>;
  let backButton: SpyObj<BackButtonService>;

  beforeEach(() => {
    barcodeScanner = jasmine.createSpyObj('BarcodeScanner', ['scan']);
    keyboard = jasmine.createSpyObj('Keyboard', ['hide']);
    backButton = jasmine.createSpyObj('BackButtonService', [
      'enable',
      'disable',
    ]);

    TestBed.configureTestingModule({
      declarations: [QuestionnaireAnswerPznComponent, MockPipe(TranslatePipe)],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: BarcodeScanner, useValue: barcodeScanner },
        { provide: Keyboard, useValue: keyboard },
        { provide: BackButtonService, useValue: backButton },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerPznComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
