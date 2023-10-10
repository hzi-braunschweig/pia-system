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

import { ConsentInputRadioComponent } from './consent-input-radio.component';
import { MockModule } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SegmentType } from '../../../../psa.app.core/models/Segments';

describe('ConsentInputRadioAppComponent', () => {
  let component: ConsentInputRadioComponent;
  let fixture: ComponentFixture<ConsentInputRadioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsentInputRadioComponent],
      imports: [
        MockModule(TranslateModule),
        MockModule(MatRadioModule),
        MockModule(ReactiveFormsModule),
      ],
    }).compileComponents();
  });

  it('should create and run ngOnInit with no error', fakeAsync(() => {
    fixture = TestBed.createComponent(ConsentInputRadioComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({});
    component.consentName = 'group';
    component.groupName = 'consent';
    component.segment = {
      type: SegmentType.CUSTOM_TAG,
      tagName: 'pia-consent-input-radio-generic',
      attrs: [{ name: 'name', value: 'myGenericConsent' }],
      children: [],
    };
    fixture.detectChanges();
    tick();
    expect(component).toBeTruthy();
  }));
});
