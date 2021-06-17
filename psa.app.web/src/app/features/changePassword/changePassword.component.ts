import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  PasswordChangeRequest,
  PasswordChangeResponse,
  User,
} from '../../psa.app.core/models/user';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { DialogPopUpComponent } from '../../_helpers/dialog-pop-up';
import { AuthenticationManager } from '../../_services/authentication-manager.service';

@Component({
  selector: 'app-change-password-component',
  templateUrl: 'changePassword.component.html',
  styleUrls: ['changePassword.component.scss'],
})
export class ChangePasswordComponent implements OnInit {
  loading = false;
  form: FormGroup;

  dropPassword = false;
  currentUser: User = null;
  minPasswordLength = 12;

  constructor(
    private router: Router,
    private matDialog: MatDialog,
    private authenticationService: AuthService,
    private auth: AuthenticationManager
  ) {
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

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }

  deselectPassword(value): void {
    this.dropPassword = value.checked;
    if (this.dropPassword) {
      this.form.controls.newPassword1.disable();
      this.form.controls.newPassword2.disable();
    } else {
      this.form.controls.newPassword1.enable();
      this.form.controls.newPassword2.enable();
    }
  }

  /**
   * Creates a validator function that checks if the password matches the other password field
   * @param passControl the FormControl for the other password field
   */
  matchPassword(passControl: FormControl): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const pass = passControl.value;
      const confirmPass = control.value;
      return pass !== confirmPass ? { matchPassword: true } : null;
    };
  }

  changePassword(): void {
    const changeData: PasswordChangeRequest = {
      oldPassword: this.form.value.oldPassword,
      newPassword1: this.form.value.newPassword1,
      newPassword2: this.form.value.newPassword2,
    };

    if (this.dropPassword) {
      changeData.newPassword1 = '';
      changeData.newPassword2 = '';
    }

    if (this.form.valid || this.dropPassword) {
      this.loading = true;
      this.authenticationService.changePassword(changeData).then(
        (result: PasswordChangeResponse) => {
          this.auth.currentUser = {
            ...this.currentUser,
            pw_change_needed: result.pw_change_needed,
          };
          this.form.controls.newPassword1.enable();
          this.form.controls.newPassword2.enable();
          this.router.navigate(['/home']);
        },
        (err: any) => {
          if (err.status === 403) {
            if (this.dropPassword) {
              if (changeData.oldPassword) {
                this.showResultDialog(
                  'CHANGE_PASSWORD.WRONG_OLD_PASSWORD',
                  false
                );
              } else {
                this.showResultDialog(
                  'CHANGE_PASSWORD.DROPPING_NO_OLD_PASSWORD',
                  false
                );
              }
            } else {
              if (changeData.oldPassword) {
                this.showResultDialog(
                  'CHANGE_PASSWORD.WRONG_OLD_PASSWORD',
                  false
                );
              } else {
                this.showResultDialog(
                  'CHANGE_PASSWORD.CHANGING_NO_OLD_PASSWORD',
                  false
                );
              }
            }
            this.loading = false;
          }
        }
      );
    }
  }

  showResultDialog(info: string, success: boolean): void {
    this.matDialog.open(DialogPopUpComponent, {
      width: '250px',
      data: { content: info, isSuccess: success },
    });
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['login']);
  }
}
