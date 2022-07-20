/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { DialogChangeComplianceComponent } from './dialog-change-compliance';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppModule } from '../app.module';
import { fakeAsync, tick } from '@angular/core/testing';
import { DialogChangeComplianceData } from '../pages/probands/probands-personal-info/probands-personal-info.component';
import { UserService } from '../psa.app.core/providers/user-service/user.service';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;
import createSpy = jasmine.createSpy;

describe('DialogChangeComplianceComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogChangeComplianceComponent;

  let dialogRef: SpyObj<MatDialogRef<DialogChangeComplianceComponent>>;
  let userService: SpyObj<UserService>;

  beforeEach(async () => {
    // Provider and Services
    dialogRef = createSpyObj<MatDialogRef<DialogChangeComplianceComponent>>([
      'close',
    ]);

    userService = createSpyObj<UserService>(['getProfessionalAccounts']);
    userService.getProfessionalAccounts.and.resolveTo([
      {
        username: 'Test-PM2',
        studies: ['Teststudy'],
        role: 'ProbandenManager',
      },
    ]);

    // Build Base Module
    await MockBuilder(DialogChangeComplianceComponent, AppModule)
      .mock(MatDialogRef, dialogRef)
      .mock(UserService, userService)
      .mock(MAT_DIALOG_DATA, createDialogData());
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = MockRender(DialogChangeComplianceComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('should call userservice to fetch professional accounts', () => {
    expect(userService.getProfessionalAccounts).toHaveBeenCalledOnceWith({
      studyName: 'Teststudy',
      onlyMailAddresses: true,
      filterSelf: true,
    });
  });

  it('should initialize filtered users', fakeAsync(() => {
    const nextSpy = createSpy();
    component.filteredUsers.subscribe(nextSpy);
    tick();
    expect(nextSpy).toHaveBeenCalledOnceWith([
      {
        username: 'Test-PM2',
        studies: ['Teststudy'],
        role: 'ProbandenManager',
      },
    ]);
  }));

  function createDialogData(): DialogChangeComplianceData {
    return {
      has_four_eyes_opposition: true,
      usernameProband: 'Test-1234',
      compliance_labresults: true,
      compliance_samples: true,
      compliance_bloodsamples: true,
      requested_by: undefined,
      requested_for: 'Test-PM2',
      deletePendingComplianceChangeId: undefined,
      studyName: 'Teststudy',
    };
  }
});
