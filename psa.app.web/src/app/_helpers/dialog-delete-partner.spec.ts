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
import { UserService } from '../psa.app.core/providers/user-service/user.service';
import { AppModule } from '../app.module';
import { fakeAsync, tick } from '@angular/core/testing';
import {
  DialogDeletePartnerComponent,
  DialogDeletePartnerData,
} from './dialog-delete-partner';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import createSpy = jasmine.createSpy;

describe('DialogDeletePartnerComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogDeletePartnerComponent;

  let dialogRef: SpyObj<MatDialogRef<DialogDeletePartnerComponent>>;
  let userService: SpyObj<UserService>;

  beforeEach(() => {
    // Provider and Services
    dialogRef = createSpyObj<MatDialogRef<DialogDeletePartnerComponent>>([
      'close',
    ]);

    userService = createSpyObj<UserService>(['getProfessionalAccounts']);
  });

  describe('personal data deletion', () => {
    beforeEach(async () => {
      const dialogData: DialogDeletePartnerData = {
        usernames: {
          usernameProband: 'Test-1234',
        },
        type: 'personal',
        affectedStudy: 'Teststudy',
      };

      // Build Base Module
      await MockBuilder(DialogDeletePartnerComponent, [
        AppModule,
        MatDialogRef,
        MAT_DIALOG_DATA,
      ])
        .mock(MatDialogRef, dialogRef)
        .mock(UserService, userService)
        .mock(MAT_DIALOG_DATA, dialogData);
    });

    beforeEach(fakeAsync(() => {
      userService.getProfessionalAccounts.and.resolveTo([
        {
          username: 'Test-PM2',
          studies: ['Teststudy'],
          role: 'ProbandenManager',
        },
      ]);

      // Create component
      fixture = MockRender(DialogDeletePartnerComponent);
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
  });

  describe('study deletion', () => {
    beforeEach(async () => {
      const dialogData: DialogDeletePartnerData = {
        usernames: {
          studyName: 'Teststudy',
          usernameSysAdmin: null,
        },
        type: 'study',
        pendingdeletionId: 1234,
      };

      // Build Base Module
      await MockBuilder(DialogDeletePartnerComponent, [
        AppModule,
        MatDialogRef,
        MAT_DIALOG_DATA,
      ])
        .mock(MatDialogRef, dialogRef)
        .mock(UserService, userService)
        .mock(MAT_DIALOG_DATA, dialogData);
    });

    beforeEach(fakeAsync(() => {
      userService.getProfessionalAccounts.and.resolveTo([
        {
          username: 'Test-SysAdmin2',
          studies: [],
          role: 'SysAdmin',
        },
      ]);

      // Create component
      fixture = MockRender(DialogDeletePartnerComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
    }));

    it('should call userservice to fetch professional accounts', () => {
      expect(userService.getProfessionalAccounts).toHaveBeenCalledOnceWith({
        role: 'SysAdmin',
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
          username: 'Test-SysAdmin2',
          studies: [],
          role: 'SysAdmin',
        },
      ]);
    }));
  });
});
