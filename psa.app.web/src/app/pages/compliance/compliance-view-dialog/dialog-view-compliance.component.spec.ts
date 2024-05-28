/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DialogViewComplianceComponent } from './dialog-view-compliance.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ComplianceService } from '../../../psa.app.core/providers/compliance-service/compliance-service';
import { ComplianceDataResponse } from '../../../psa.app.core/models/compliance';
import { MockModule } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import { AlertService } from '../../../_services/alert.service';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';

describe('DialogViewComplianceComponent', () => {
  let component: DialogViewComplianceComponent;
  let fixture: ComponentFixture<DialogViewComplianceComponent>;

  let dialogRef: MatDialogRef<DialogViewComplianceComponent>;
  let complianceService: ComplianceService;
  let alertService: AlertService;
  const authManager = { currentRole: null };

  beforeEach(() => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    complianceService = jasmine.createSpyObj('ComplianceService', [
      'getComplianceAgreementById',
    ]);

    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);

    TestBed.configureTestingModule({
      declarations: [DialogViewComplianceComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            username: 'Testproband',
            study: 'Teststudie',
          },
        },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: ComplianceService, useValue: complianceService },
        { provide: AlertService, useValue: alertService },
        { provide: AuthenticationManager, useValue: authManager },
      ],
      imports: [MockModule(TranslateModule)],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogViewComplianceComponent);
    component = fixture.componentInstance;
  });

  describe('ngOnInit()', () => {
    it('should fetch and show compliance agreements', async () => {
      (
        complianceService.getComplianceAgreementById as jasmine.Spy
      ).and.resolveTo(getComplianceData());

      await component.ngOnInit();
      fixture.detectChanges();

      expect(component.complianceData).toEqual(getComplianceData());
    });

    it('should show an error if fetch fails', async () => {
      (
        complianceService.getComplianceAgreementById as jasmine.Spy
      ).and.rejectWith();

      await component.ngOnInit();
      fixture.detectChanges();

      expect(alertService.errorObject).toHaveBeenCalled();
    });
  });

  function getComplianceData(): ComplianceDataResponse {
    return {
      timestamp: new Date('01.01.2021'),
      compliance_text_object: [],
      textfields: {
        firstname: 'Michael',
        lastname: 'Myers',
        birthdate: new Date('01.01.1900'),
      },
      compliance_system: {
        app: true,
        samples: true,
        bloodsamples: false,
        labresults: false,
      },
      compliance_questionnaire: [{ name: 'world-domination', value: true }],
    };
  }
});
