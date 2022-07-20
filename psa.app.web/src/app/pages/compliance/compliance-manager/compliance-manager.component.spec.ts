/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComplianceManagerComponent } from './compliance-manager.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogViewComplianceComponent } from '../compliance-view-dialog/dialog-view-compliance.component';
import { AlertService } from '../../../_services/alert.service';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { HttpClientModule } from '@angular/common/http';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { MockModule } from 'ng-mocks';

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
  let alertService: AlertService;
  let userService: UserService;
  const authManager = { currentRole: 'EinwilligungsManager' };

  beforeEach(() => {
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    userService = jasmine.createSpyObj('UserService', ['getStudies']);

    TestBed.configureTestingModule({
      declarations: [ComplianceManagerComponent, MockTranslatePipe],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: AlertService, useValue: alertService },
        { provide: UserService, useValue: userService },
        { provide: AuthenticationManager, useValue: authManager },
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
