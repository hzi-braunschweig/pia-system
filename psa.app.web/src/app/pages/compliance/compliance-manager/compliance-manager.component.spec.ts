/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComplianceManagerComponent } from './compliance-manager.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { DialogViewComplianceComponent } from '../compliance-view-dialog/dialog-view-compliance.component';
import { AlertService } from '../../../_services/alert.service';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { HttpClientModule } from '@angular/common/http';
import { MockModule, MockProvider } from 'ng-mocks';
import { ComplianceService } from '../../../psa.app.core/providers/compliance-service/compliance-service';
import SpyObj = jasmine.SpyObj;

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value): any {
    return value;
  }
}

describe('ComplianceManagerComponent', () => {
  let component: ComplianceManagerComponent;
  let fixture: ComponentFixture<ComplianceManagerComponent>;

  let dialog: MatDialog;
  let complianceService: SpyObj<ComplianceService>;
  let alertService: SpyObj<AlertService>;
  let userService: SpyObj<UserService>;

  beforeEach(() => {
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    complianceService = jasmine.createSpyObj('ComplianceService', [
      'getAllCompliancesForProfessional',
    ]);
    complianceService.getAllCompliancesForProfessional.and.resolveTo([]);
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    userService = jasmine.createSpyObj('UserService', ['getStudies']);

    TestBed.configureTestingModule({
      declarations: [ComplianceManagerComponent, MockTranslatePipe],
      providers: [
        MockProvider(MatDialog, dialog),
        MockProvider(ComplianceService, complianceService),
        MockProvider(AlertService, alertService),
        MockProvider(UserService, userService),
      ],
      imports: [MockModule(HttpClientModule)],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ComplianceManagerComponent);
    component = fixture.componentInstance;
    fixture.componentInstance.activeFilter.studyName = 'test-study';
  });

  describe('showComplianceDetails()', () => {
    it('open compliance details dialog', () => {
      component.showComplianceDetails(1234);
      expect(dialog.open).toHaveBeenCalledWith(
        DialogViewComplianceComponent,
        jasmine.objectContaining({
          data: { study: 'test-study', complianceId: 1234 },
        })
      );
    });
  });
});
