/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceRadioComponent } from './compliance-radio.component';
import { ComplianceService } from '../../../../psa.app.core/providers/compliance-service/compliance-service';
import { AlertService } from '../../../../_services/alert.service';
import { MockModule, MockProvider } from 'ng-mocks';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import SpyObj = jasmine.SpyObj;

describe('ComplianceRadioComponent', () => {
  let component: ComplianceRadioComponent;
  let fixture: ComponentFixture<ComplianceRadioComponent>;
  let complianceService: SpyObj<ComplianceService>;
  let alertService: SpyObj<AlertService>;

  beforeEach(async () => {
    complianceService = jasmine.createSpyObj('ComplianceService', [
      'getGenericFields',
    ]);
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    complianceService.getGenericFields.and.resolveTo([
      {
        type: 'TEXT',
        placeholder: 'text',
        label: 'Any Label',
      },
      {
        type: 'RADIO',
        placeholder: 'consent',
      },
    ]);
    await TestBed.configureTestingModule({
      declarations: [ComplianceRadioComponent],
      providers: [
        MockProvider(ComplianceService, complianceService),
        MockProvider(AlertService, alertService),
      ],
      imports: [
        MockModule(MatCardModule),
        MockModule(TranslateModule),
        MockModule(MatDividerModule),
        MockModule(MatListModule),
        MockModule(MatFormFieldModule),
        MockModule(ReactiveFormsModule),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceRadioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
