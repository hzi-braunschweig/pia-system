/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { fakeAsync, tick } from '@angular/core/testing';
import {
  DialogChangeStudyComponent,
  DialogChangeStudyData,
} from './dialog-change-study.component';
import { AppModule } from '../../app.module';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import { createStudy } from '../../psa.app.core/models/instance.helper.spec';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;
import createSpy = jasmine.createSpy;

describe('DialogChangeStudyComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogChangeStudyComponent;

  let dialogRef: SpyObj<MatDialogRef<DialogChangeStudyComponent>>;
  let userService: SpyObj<UserService>;

  beforeEach(async () => {
    // Provider and Services
    dialogRef = createSpyObj<MatDialogRef<DialogChangeStudyComponent>>([
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
    await MockBuilder(DialogChangeStudyComponent, [
      AppModule,
      MAT_DIALOG_DATA,
      MatDialogRef,
    ])
      .mock(MatDialogRef, dialogRef)
      .mock(UserService, userService)
      .mock(MAT_DIALOG_DATA, createDialogData());
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = MockRender(DialogChangeStudyComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('should call userservice to fetch professional accounts', () => {
    expect(userService.getProfessionalAccounts).toHaveBeenCalledOnceWith({
      studyName: 'Teststudy',
      onlyMailAddresses: true,
      filterSelf: true,
      accessLevel: 'admin',
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

  function createDialogData(): DialogChangeStudyData {
    return {
      study: createStudy({ name: 'Teststudy' }),
    };
  }
});
