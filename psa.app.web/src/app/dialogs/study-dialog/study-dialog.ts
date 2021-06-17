import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { Studie } from '../../psa.app.core/models/studie';
import { AlertService } from '../../_services/alert.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../../psa.app.core/models/user';

@Component({
  selector: 'app-study-dialog',
  templateUrl: 'study-dialog.html',
  styleUrls: ['study-dialog.scss'],
})
export class DialogStudyComponent implements OnInit {
  form: FormGroup;
  study: Studie;
  currentRole: string;

  accesses = [
    { value: 'read', viewValue: 'DIALOG.READ' },
    { value: 'write', viewValue: 'DIALOG.WRITE' },
    { value: 'admin', viewValue: 'DIALOG.ADMIN' },
  ];

  constructor(
    public dialogRef: MatDialogRef<DialogStudyComponent>,
    private alertService: AlertService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private questionnaireService: QuestionnaireService
  ) {
    const jwtHelper: JwtHelperService = new JwtHelperService();
    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));
    const tokenPayload = jwtHelper.decodeToken(currentUser.token);
    this.currentRole = tokenPayload.role;
  }

  ngOnInit(): void {
    if (this.data.name) {
      this.questionnaireService.getStudy(this.data.name).then(
        (result: any) => {
          this.study = result;
          this.initForm();
        },
        (err: any) => {
          this.alertService.errorObject(err);
        }
      );
    } else {
      this.initForm();
    }
  }

  initForm(): void {
    const name = this.study ? this.study.name : null;
    const description = this.study ? this.study.description : null;
    const pm_email = this.study ? this.study.pm_email : null;
    const hub_email = this.study ? this.study.hub_email : null;
    const has_rna_samples = this.study ? this.study.has_rna_samples : false;
    const sample_prefix = this.study ? this.study.sample_prefix : '';
    const sample_suffix_length = this.study
      ? this.study.sample_suffix_length
      : null;
    const pseudonym_prefix = this.study ? this.study.pseudonym_prefix : '';
    const pseudonym_suffix_length = this.study
      ? this.study.pseudonym_suffix_length
      : null;
    this.form = new FormGroup({
      name: new FormControl(name, Validators.required),
      description: new FormControl(description, Validators.required),
      pm_email: new FormControl(pm_email, Validators.email),
      hub_email: new FormControl(hub_email, Validators.email),
      has_rna_samples: new FormControl(has_rna_samples, Validators.required),
      sample_prefix: new FormControl(sample_prefix),
      sample_suffix_length: new FormControl(sample_suffix_length),
      pseudonym_prefix: new FormControl(pseudonym_prefix),
      pseudonym_suffix_length: new FormControl(pseudonym_suffix_length),
    });
    if (this.study) {
      this.form.controls['name'].disable();
    }
    if (this.currentRole === 'Forscher') {
      this.form.controls['pm_email'].disable();
      this.form.controls['hub_email'].disable();
    } else if (this.currentRole === 'SysAdmin') {
      this.form.controls['has_rna_samples'].disable();
      this.form.controls['sample_prefix'].disable();
      this.form.controls['sample_suffix_length'].disable();
      this.form.controls['pseudonym_prefix'].disable();
      this.form.controls['pseudonym_suffix_length'].disable();
    }
  }

  submit(form): void {
    this.form.controls['name'].enable();
    this.study = form.value;
    this.study.pm_email = this.study.pm_email ? this.study.pm_email : null;
    this.study.hub_email = this.study.hub_email ? this.study.hub_email : null;
    this.study.has_rna_samples = this.study.has_rna_samples
      ? this.study.has_rna_samples
      : false;
    this.study.sample_prefix = this.study.sample_prefix
      ? this.study.sample_prefix
      : '';
    this.study.sample_suffix_length = this.study.sample_suffix_length
      ? this.study.sample_suffix_length
      : null;
    this.study.pseudonym_prefix = this.study.pseudonym_prefix
      ? this.study.pseudonym_prefix
      : '';
    this.study.pseudonym_suffix_length = this.study.pseudonym_suffix_length
      ? this.study.pseudonym_suffix_length
      : null;

    if (this.data.name) {
      this.questionnaireService.putStudy(this.study.name, this.study).then(
        (result: any) => {
          this.study = result;
          this.dialogRef.close(`${form.value}`);
        },
        (err: any) => {
          this.alertService.errorObject(err);
        }
      );
    } else {
      this.questionnaireService.postStudy(this.study).then(
        (result: any) => {
          this.study = result;
          this.dialogRef.close(`${form.value}`);
        },
        (err: any) => {
          this.alertService.errorObject(err);
        }
      );
    }
  }
}
