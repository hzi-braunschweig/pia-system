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

import { ConsentInputTextComponent } from './consent-input-text.component';
import { MockModule } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SegmentType } from '../../../../psa.app.core/models/Segments';

describe('ConsentInputTextComponent', () => {
  let component: ConsentInputTextComponent;
  let fixture: ComponentFixture<ConsentInputTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsentInputTextComponent],
      imports: [
        MockModule(TranslateModule),
        MockModule(MatFormFieldModule),
        MockModule(ReactiveFormsModule),
      ],
    }).compileComponents();
  });

  it('should create and run ngOnInit with no error', fakeAsync(() => {
    fixture = TestBed.createComponent(ConsentInputTextComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({});
    component.consentName = 'group';
    component.groupName = 'text';
    component.segment = {
      type: SegmentType.CUSTOM_TAG,
      tagName: 'pia-consent-input-text-generic',
      attrs: [
        { name: 'name', value: 'myGenericText' },
        { name: 'label', value: 'Any comment' },
      ],
      children: [],
    };
    fixture.detectChanges();
    tick();
    expect(component).toBeTruthy();
  }));
});
