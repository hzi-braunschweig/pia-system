/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { PasswordChangeRequest, Role } from '../../psa.app.core/models/user';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import {
  DialogPopUpComponent,
  DialogPopUpData,
} from '../../_helpers/dialog-pop-up';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-change-password-component',
  templateUrl: 'changePassword.component.html',
  styleUrls: ['changePassword.component.scss'],
})
export class ChangePasswordComponent {
  public isLoading = false;
  public form: FormGroup;

  public dropPassword = false;
  public currentRole: Role = null;
  public minPasswordLength = 12;

  public revealOldPassword = false;
  public revealNewPassword1 = false;
  public revealNewPassword2 = false;

  constructor(
    private router: Router,
    private matDialog: MatDialog,
    private authenticationService: AuthService,
    private auth: AuthenticationManager
  ) {
    this.currentRole = this.auth.getCurrentRole();
    const newPassword1 = new FormControl('', [
      Validators.required,
      Validators.minLength(this.minPasswordLength),
      Validators.pattern(
        `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[#$@!%&+*?:;<=>_|/~(),-.{}\\s])[A-Za-z\\d#$@!%&+*?:;<=>_|/~(),-.{}\\s]{${this.minPasswordLength},}$`
      ),
    ]);
    const newPassword2 = new FormControl('', [
      Validators.required,
      Validators.minLength(this.minPasswordLength),
      this.matchPassword(newPassword1),
    ]);
    const oldPassword = new FormControl('');
    this.form = new FormGroup({
      oldPassword,
      newPassword1,
      newPassword2,
    });
  }

  public deselectPassword(value: boolean): void {
    this.dropPassword = value;
    if (this.dropPassword) {
      this.form.get('newPassword1').disable();
      this.form.get('newPassword2').disable();
    } else {
      this.form.get('newPassword1').enable();
      this.form.get('newPassword2').enable();
    }
  }

  /**
   * Creates a validator function that checks if the password matches the other password field
   * @param passControl the FormControl for the other password field
   */
  private matchPassword(passControl: FormControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const pass = passControl.value;
      const confirmPass = control.value;
      return pass !== confirmPass ? { matchPassword: true } : null;
    };
  }

  public async changePassword(): Promise<void> {
    const changeData: PasswordChangeRequest = this.form.value;

    if (this.dropPassword) {
      changeData.newPassword1 = '';
      changeData.newPassword2 = '';
    }

    if (!(this.form.valid || this.dropPassword)) {
      return;
    }
    this.isLoading = true;
    try {
      await this.authenticationService.changePassword(changeData);
      this.auth.setPasswordChangeNeeded(false);
      this.form.get('newPassword1').enable();
      this.form.get('newPassword2').enable();
      this.router.navigate(['/home']);
    } catch (err) {
      if (err.status === 403) {
        this.showErrorDialog();
      }
    }
    this.isLoading = false;
  }

  private showErrorDialog(): void {
    const emptyOldPassword = !this.form.get('oldPassword').value;
    const popUpData: DialogPopUpData = { content: '', isSuccess: false };
    if (this.dropPassword) {
      if (!emptyOldPassword) {
        popUpData.content = 'CHANGE_PASSWORD.WRONG_OLD_PASSWORD';
      } else {
        popUpData.content = 'CHANGE_PASSWORD.DROPPING_NO_OLD_PASSWORD';
      }
    } else {
      if (!emptyOldPassword) {
        popUpData.content = 'CHANGE_PASSWORD.WRONG_OLD_PASSWORD';
      } else {
        popUpData.content = 'CHANGE_PASSWORD.CHANGING_NO_OLD_PASSWORD';
      }
    }
    this.matDialog.open(DialogPopUpComponent, {
      width: '250px',
      data: popUpData,
    });
  }

  public async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigate(['login']);
  }
}
