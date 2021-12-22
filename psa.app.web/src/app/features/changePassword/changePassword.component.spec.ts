/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder } from 'ng-mocks';
import { AppModule } from 'src/app/app.module';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ChangePasswordComponent } from './changePassword.component';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import { Router } from '@angular/router';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import SpyObj = jasmine.SpyObj;

describe('ChangePasswordComponent', () => {
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let component: ChangePasswordComponent;
  let auth: SpyObj<AuthenticationManager>;
  let authService: SpyObj<AuthService>;
  let router: SpyObj<Router>;
  let matDialog: SpyObj<MatDialog>;

  beforeEach(() => MockBuilder(ChangePasswordComponent, AppModule));

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component
    auth = TestBed.inject(
      AuthenticationManager
    ) as SpyObj<AuthenticationManager>;
    authService = TestBed.inject(AuthService) as SpyObj<AuthService>;
    router = TestBed.inject(Router) as SpyObj<Router>;
    matDialog = TestBed.inject(MatDialog) as SpyObj<MatDialog>;

    // Create component
    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  function setValidPasswords(): void {
    component.form.get('oldPassword').setValue('oldPassword');
    component.form.get('newPassword1').setValue('newPassword12$');
    component.form.get('newPassword2').setValue('newPassword12$');
  }

  describe('changePassword()', () => {
    it('should change the password successfully, if the form is valid', fakeAsync(() => {
      setValidPasswords();
      component.changePassword();
      tick();
      expect(router.navigate).toHaveBeenCalledOnceWith(['/home']);
    }));

    it('should try to change the password but show error for wrong old password', fakeAsync(() => {
      setValidPasswords();
      authService.changePassword.and.rejectWith(
        new HttpErrorResponse({ status: 403 })
      );
      component.changePassword();
      tick();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(matDialog.open).toHaveBeenCalledTimes(1);
    }));

    it('should try to change the password but show error for wrong old password if no password is selected', fakeAsync(() => {
      setValidPasswords();
      component.deselectPassword(true);
      authService.changePassword.and.rejectWith(
        new HttpErrorResponse({ status: 403 })
      );
      component.changePassword();
      tick();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(matDialog.open).toHaveBeenCalledTimes(1);
    }));
  });

  describe('logout()', () => {
    it('should logout and navigate to login', () => {
      component.logout();

      expect(auth.logout).toHaveBeenCalledOnceWith();
      expect(router.navigate).toHaveBeenCalledOnceWith(['login']);
      expect(component).toBeDefined();
    });
  });
});
