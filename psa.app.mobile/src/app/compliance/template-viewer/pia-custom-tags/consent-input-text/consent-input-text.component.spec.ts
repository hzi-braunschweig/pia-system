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
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MockModule } from 'ng-mocks';

import { ConsentInputTextComponent } from './consent-input-text.component';
import { SegmentType } from '../../../segment.model';

describe('ConsentInputTextComponent', () => {
  let component: ConsentInputTextComponent;
  let fixture: ComponentFixture<ConsentInputTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsentInputTextComponent],
      imports: [MockModule(TranslateModule), MockModule(ReactiveFormsModule)],
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
