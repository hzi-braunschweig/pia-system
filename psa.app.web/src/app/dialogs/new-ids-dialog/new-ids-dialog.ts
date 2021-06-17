import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../../psa.app.core/models/user';
import { TranslateService } from '@ngx-translate/core';
import { DialogPopUpComponent } from 'src/app/_helpers/dialog-pop-up';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'dialog-new-ids',
  styleUrls: ['new-ids-dialog.scss'],
  templateUrl: 'new-ids-dialog.html',
})
export class DialogNewIdsComponent implements OnInit {
  form: FormGroup;
  currentRole: string;
  studies: string[];
  filteredStudiesArray = [];
  isLoading: boolean = false;

  public studiesFilterCtrl: FormControl = new FormControl();
  public filteredStudies: ReplaySubject<string[]> = new ReplaySubject<string[]>(
    1
  );

  constructor(
    public dialogRef: MatDialogRef<DialogNewIdsComponent>,
    private authService: AuthService,
    private alertService: AlertService,
    private translate: TranslateService,
    private questionnaireService: QuestionnaireService,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const jwtHelper: JwtHelperService = new JwtHelperService();
    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));
    const tokenPayload = jwtHelper.decodeToken(currentUser.token);
    this.currentRole = tokenPayload.role;
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.questionnaireService.getStudies().then(
      (result: any) => {
        // hard coded filtering of ZIFCO-Studie
        this.studies = result.studies
          .map((study) => study.name)
          .filter((name) => name !== 'ZIFCO-Studie');
        this.filteredStudiesArray = this.studies;
        this.filteredStudies.next(this.filteredStudiesArray);
        this.isLoading = false;

        this.form = new FormGroup({
          ids: new FormControl('', Validators.required),
          study_accesses: new FormControl(null, Validators.required),
        });

        // listen for search field value changes
        this.studiesFilterCtrl.valueChanges.subscribe(() => {
          this.filterStudies();
        });
        this.isLoading = false;
      },
      (err: any) => {
        this.isLoading = false;
        this.alertService.errorObject(err);
      }
    );
  }

  private filterStudies(): void {
    this.filteredStudies.next(this.studies);
    if (!this.studies) {
      return;
    }
    // get the search keyword
    let search = this.studiesFilterCtrl.value;
    if (!search) {
      this.filteredStudiesArray = this.studies;
      this.filteredStudies.next(this.studies.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the questionnaires
    this.filteredStudiesArray = this.studies.filter(
      (study) => study.toLowerCase().indexOf(search) > -1
    );
    this.filteredStudies.next(this.filteredStudiesArray);
  }

  submit(form): void {
    if (
      this.form.controls['study_accesses'].value &&
      this.form.controls['study_accesses'].value[0] === 'allStudiesCheckbox'
    ) {
      this.form.controls['study_accesses'].value.shift();
    }

    this.authService.postIDS(form.value).then(
      (result: any) => {
        this.dialogRef.close(result);
      },
      (err: any) => {
        this.dialog.open(DialogPopUpComponent, {
          width: '500px',
          data: {
            data: '',
            content: 'DIALOG.CREATE_IDS_ERROR',
            isSuccess: false,
          },
        });
      }
    );
  }

  onSelectAllStudiesClicked(): void {
    const studiesNameArray = [];
    if (
      this.form.controls['study_accesses'].value[0] === 'allStudiesCheckbox' &&
      this.form.controls['study_accesses'].value.length !==
        this.filteredStudiesArray.length + 1
    ) {
      studiesNameArray.push('allStudiesCheckbox');
      for (const study of this.filteredStudiesArray) {
        studiesNameArray.push(study);
      }
    }
    this.form.controls['study_accesses'].setValue(studiesNameArray);
  }
}
