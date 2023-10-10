/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceTextComponent } from './compliance-text.component';
import { ComplianceService } from '../../../../psa.app.core/providers/compliance-service/compliance-service';
import { AlertService } from '../../../../_services/alert.service';
import { MockModule, MockProvider } from 'ng-mocks';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { TranslateModule } from '@ngx-translate/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { ReactiveFormsModule } from '@angular/forms';
import SpyObj = jasmine.SpyObj;

describe('ComplianceTextComponent', () => {
  let component: ComplianceTextComponent;
  let fixture: ComponentFixture<ComplianceTextComponent>;
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
      declarations: [ComplianceTextComponent],
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
    fixture = TestBed.createComponent(ComplianceTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
