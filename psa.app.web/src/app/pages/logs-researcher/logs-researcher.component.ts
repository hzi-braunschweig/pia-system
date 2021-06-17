import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
  AbstractControl,
} from '@angular/forms';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { UserWithStudyAccess } from '../../psa.app.core/models/user-with-study-access';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../../psa.app.core/models/user';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ReplaySubject } from 'rxjs';
import { Questionnaire } from '../../psa.app.core/models/questionnaire';
import { Studie } from '../../psa.app.core/models/studie';
import { AlertService } from '../../_services/alert.service';
import { LoggingService } from 'src/app/psa.app.core/providers/logging-service/logging-service';
import { GetActivityTypePipe } from '../../pipes/acitivity-type.pipe';
import { TranslateService } from '@ngx-translate/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { forwardRef } from '@angular/core';
import { MatPaginatorIntlGerman } from '../../_helpers/mat-paginator-intl';

export interface LogElement {
  id: number;
  user_id: string;
  app: string;
  timestamp: string;
  activity: {
    type: string;
    questionnaireID: string;
    questionnaireName: string;
    questionnaireInstanceId: string;
  };
}

@Component({
  templateUrl: 'logs-researcher.component.html',
  styleUrls: ['logs-researcher.component.scss'],
  providers: [
    GetActivityTypePipe,
    TranslateService,
    {
      provide: MatPaginatorIntl,
      useClass: forwardRef(() => MatPaginatorIntlGerman),
    },
  ],
})
export class LogsResearcherComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  studies: Studie[];
  users: UserWithStudyAccess[];
  probands: UserWithStudyAccess[] = [];
  studiesProbands: UserWithStudyAccess[] = [];
  questionnaires: Questionnaire[];
  studiesQuestionnaires: Questionnaire[];
  filteredProbandsArray = [];
  filteredQuestionnairesArray = [];
  currentRole: string;
  currentDate = new Date();
  public studyFilterCtrl: FormControl = new FormControl();
  public filteredStudies: ReplaySubject<Studie[]> = new ReplaySubject<Studie[]>(
    1
  );
  public usernameFilterCtrl: FormControl = new FormControl();
  public filteredUsers: ReplaySubject<UserWithStudyAccess[]> =
    new ReplaySubject<UserWithStudyAccess[]>(1);
  public questionnaireFilterCtrl: FormControl = new FormControl();
  public filteredQuestionnaires: ReplaySubject<Questionnaire[]> =
    new ReplaySubject<Questionnaire[]>(1);
  loading = true;
  displayedColumns = [
    'user_id',
    'activity.type',
    'timestamp',
    'app',
    'activity.questionnaireName',
  ];
  dataSource = new MatTableDataSource<LogElement>();

  activities = [
    { value: 'login', viewValue: 'LOGS.LOGIN' },
    { value: 'logout', viewValue: 'LOGS.LOGOUT' },
    { value: 'q_released_once', viewValue: 'LOGS.Q_RELEASED_ONCE' },
    { value: 'q_released_twice', viewValue: 'LOGS.Q_RELEASED_TWICE' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private alertService: AlertService,
    private questionnaireService: QuestionnaireService,
    private loggingService: LoggingService,
    private getActivityType: GetActivityTypePipe,
    private translate: TranslateService,
    public snackBar: MatSnackBar
  ) {
    this.questionnaireService.getStudies().then(
      (result: any) => {
        this.studies = result.studies;
        this.filteredStudies.next(this.studies.slice());
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );

    this.authService.getUsers().then(
      (result: any) => {
        this.users = result.users;
        this.users.forEach((user) => {
          if (user.first_logged_in_at != null) {
            user.first_logged_in_at = new Date(
              user.first_logged_in_at
            ).toLocaleDateString();
          }
          user.studyNamesArray = [];
          user.study_accesses.forEach((study) => {
            user.studyNamesArray.push(study.study_id);
          });
          if (user.role === 'Proband') {
            this.probands.push(user);
          }
        });

        this.studiesProbands = this.probands;
        this.filteredProbandsArray = this.studiesProbands;
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );

    this.questionnaireService.getQuestionnaires().then(
      (result) => {
        this.questionnaires = result.questionnaires;
        this.studiesQuestionnaires = this.questionnaires;
        this.filteredQuestionnairesArray = this.studiesQuestionnaires;
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );

    const jwtHelper: JwtHelperService = new JwtHelperService();
    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));
    // decode the token to get its payload
    const tokenPayload = jwtHelper.decodeToken(currentUser.token);
    this.currentRole = tokenPayload.role;

    this.dataSource.filterPredicate = (log: LogElement, filter: string) =>
      (
        log.user_id +
        log.timestamp +
        log.app +
        this.translate.instant(
          this.getActivityType.transform(log.activity.type)
        ) +
        log.activity.questionnaireName
      )
        .toLowerCase()
        .indexOf(filter) !== -1;
  }

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) matSort: MatSort;

  applyFilter(filterValue: string): void {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  /**
   * Set the paginator after the view init since this component will
   * be able to query its view for the initialized paginator.
   */
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.matSort;
  }

  ngOnInit(): void {
    this.form = new FormGroup(
      {
        start_date: new FormControl(null),
        end_date: new FormControl(null),
        study_name: new FormControl(null, Validators.required),
        questionnaires: new FormControl(null),
        activity_type: new FormControl(null, Validators.required),
        probands: new FormControl(null, [
          Validators.required,
          this.validateProbands,
        ]),
      },
      this.validateQuestionnaires
    );

    // listen for search field value changes
    this.studyFilterCtrl.valueChanges.subscribe(() => {
      this.filterStudies();
    });

    // listen for search field value changes
    this.usernameFilterCtrl.valueChanges.subscribe(() => {
      this.filterUsers();
    });

    // listen for search field value changes
    this.questionnaireFilterCtrl.valueChanges.subscribe(() => {
      this.filterQuestionnaires();
    });

    this.loggingService
      .getLogs({})
      .then((res) => {
        this.updateLogTable([]);
      })
      .catch((err) => {
        console.log(err);
        this.openSnackBar('LOGS.COULD_NOT_LOAD', 'OK');
      });

    // This is workaround to sort nested objects
    this.dataSource.sortingDataAccessor = (item: any, property) => {
      switch (property) {
        case 'activity.type':
          return item.activity.type;
        case 'activity.questionnaireName':
          return item.activity.questionnaireName;
        default:
          return item[property];
      }
    };
  }

  validateProbands(control: AbstractControl): any {
    const curSelectedProbands = control.value;

    if (
      !curSelectedProbands ||
      curSelectedProbands.length === 0 ||
      (curSelectedProbands.length === 1 &&
        curSelectedProbands[0] === 'allProbandsCheckbox')
    ) {
      return { required: true };
    } else {
      return null;
    }
  }

  validateQuestionnaires(control: AbstractControl): any {
    const curActivities = control.get('activity_type').value;
    const curQuestionnaires = control.get('questionnaires').value;
    let questionnaireActivitySelected = false;
    if (curActivities) {
      questionnaireActivitySelected = curActivities.find((value) => {
        return value === 'q_released_once' || value === 'q_released_twice';
      });
    }
    if (
      questionnaireActivitySelected &&
      (!curQuestionnaires ||
        curQuestionnaires.length === 0 ||
        (curQuestionnaires.length === 1 &&
          curQuestionnaires[0] === 'allQuestionnairesCheckbox'))
    ) {
      return { questionnairesRequired: true };
    } else {
      return null;
    }
  }

  updateLogTable(newData: any[]): void {
    this.loading = false;
    this.dataSource.data = newData;
    this.openSnackBar('LOGS.LOADED_SUCCESSFULLY', 'OK');
    this.dataSource.paginator.firstPage();
  }

  generateQueryFrom(form): {
    fromTime?: Date;
    toTime?: Date;
    probands?: string[];
    questionnaires?: string[];
    activities?: string[];
  } {
    const query = {
      fromTime: undefined,
      toTime: undefined,
      probands: undefined,
      questionnaires: undefined,
      activities: undefined,
    };

    if (form.value && form.value.start_date) {
      query.fromTime = new Date(form.value.start_date);
    }

    if (form.value && form.value.end_date) {
      query.toTime = new Date(form.value.end_date);
    }

    if (form.value && form.value.probands) {
      query.probands = form.value.probands;
    }

    if (form.value && form.value.questionnaires) {
      query.questionnaires = form.value.questionnaires;
    }

    if (form.value && form.value.activity_type) {
      query.activities = form.value.activity_type;
    }

    return query;
  }

  areQuestionnaireLogsSelected(): boolean {
    const curValues = this.form.controls['activity_type'].value;
    if (curValues) {
      return curValues.find((value) => {
        return value === 'q_released_once' || value === 'q_released_twice';
      });
    } else {
      return false;
    }
  }

  onStartDateChange(): void {
    const start = this.form.controls['start_date'].value;
    const end = this.form.controls['end_date'].value;
    if (end && start && end < start) {
      this.form.controls['end_date'].setValue(start);
    }
  }

  onChange(option: HTMLOptionElement): void {
    this.studiesProbands = [];
    this.studiesQuestionnaires = [];
    this.findUserInStudy(option.value);
    this.findQuestionnaireInStudy(option.value);

    this.filterUsers();
    this.filterQuestionnaires();
  }

  findUserInStudy(study_name: string): void {
    this.probands.forEach((proband) => {
      if (
        proband.studyNamesArray !== undefined &&
        proband.studyNamesArray.includes(study_name)
      ) {
        this.studiesProbands.push(proband);
      }
    });
  }

  findQuestionnaireInStudy(study_name: string): void {
    this.questionnaires.forEach((questionnaire) => {
      if (
        questionnaire.study_id !== undefined &&
        questionnaire.study_id === study_name
      ) {
        this.studiesQuestionnaires.push(questionnaire);
      }
    });
  }

  private filterUsers(): void {
    this.filteredUsers.next(this.studiesProbands);
    if (!this.studiesProbands) {
      return;
    }
    // get the search keyword
    let search = this.usernameFilterCtrl.value;
    if (!search) {
      this.filteredProbandsArray = this.studiesProbands;
      this.filteredUsers.next(this.studiesProbands.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the users
    this.filteredProbandsArray = this.studiesProbands.filter(
      (user) => user.username.toLowerCase().indexOf(search) > -1
    );
    this.filteredUsers.next(this.filteredProbandsArray);
  }

  private filterQuestionnaires(): void {
    this.filteredQuestionnaires.next(this.studiesQuestionnaires);
    if (!this.studiesQuestionnaires) {
      return;
    }
    // get the search keyword
    let search = this.questionnaireFilterCtrl.value;
    if (!search) {
      this.filteredQuestionnairesArray = this.studiesQuestionnaires;
      this.filteredQuestionnaires.next(this.studiesQuestionnaires.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the questionnaires
    this.filteredQuestionnairesArray = this.studiesQuestionnaires.filter(
      (questionnaire) => questionnaire.name.toLowerCase().indexOf(search) > -1
    );
    this.filteredQuestionnaires.next(this.filteredQuestionnairesArray);
  }

  private filterStudies(): void {
    this.filteredStudies.next(this.studies);
    if (!this.studies) {
      return;
    }
    // get the search keyword
    let search = this.studyFilterCtrl.value;
    if (!search) {
      this.filteredStudies.next(this.studies.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the users
    this.filteredStudies.next(
      this.studies.filter(
        (study) => study.name.toLowerCase().indexOf(search) > -1
      )
    );
  }

  openSnackBar(message: string, action: string): void {
    this.loading = false;
    message = this.translate.instant(message);
    this.snackBar.open(message, action, {
      duration: 2000,
    });
  }

  onSubmit(form, makeExport: boolean): void {
    this.loading = true;

    if (this.form.controls['questionnaires'].value) {
      if (
        this.form.controls['questionnaires'].value[0] ===
        'allQuestionnairesCheckbox'
      ) {
        this.form.controls['questionnaires'].value.shift();
      }
    }
    if (
      this.form.controls['questionnaires'].value &&
      this.form.controls['questionnaires'].value.length > 0 &&
      !this.areQuestionnaireLogsSelected()
    ) {
      this.form.controls['questionnaires'].setValue([]);
    }

    if (this.form.controls['probands'].value[0] === 'allProbandsCheckbox') {
      this.form.controls['probands'].value.shift();
    }

    const query = this.generateQueryFrom(form);
    this.loggingService
      .getLogs(query)
      .then((res) => {
        this.updateLogTable(res);
        if (makeExport) {
          this.saveExportFile(res);
        }
      })
      .catch((err) => {
        console.log(err);
        this.openSnackBar('LOGS.COULD_NOT_LOAD', 'OK');
      });
  }

  saveExportFile(exportData: any): void {
    exportData = JSON.parse(
      JSON.stringify(exportData).split('"user_id":').join('"Proband":')
    );
    exportData = JSON.parse(
      JSON.stringify(exportData).split('"app":').join('"App":')
    );
    exportData = JSON.parse(
      JSON.stringify(exportData).split('"timestamp":').join('"Zeitstempel":')
    );
    exportData = JSON.parse(
      JSON.stringify(exportData).split('"activity":').join('"Aktivität":')
    );
    exportData.forEach((element) => {
      delete element['id'];
      element['Zeitstempel'] = new Date(
        element['Zeitstempel']
      ).toLocaleString();
      element['Anhang'] =
        element['Aktivität']['type'] === 'q_released_once' ||
        element['Aktivität']['type'] === 'q_released_twice'
          ? element['Aktivität']['questionnaireName']
          : '';
      switch (element['Aktivität']['type']) {
        case 'q_released_once': {
          element['Aktivität'] = 'Fragebogen freigegeben';
          break;
        }
        case 'q_released_twice': {
          element['Aktivität'] = 'Fragebogen endgueltig freigegeben';
          break;
        }
        case 'login': {
          element['Aktivität'] = 'Anmeldung';
          break;
        }
        case 'logout': {
          element['Aktivität'] = 'Abmeldung';
          break;
        }
        default: {
          element['Aktivität'] = 'unbekannt';
          break;
        }
      }
    });

    // convert JSON Object to format for csv export
    const replacer = (key, value) => (value === null ? '' : value);
    const header = Object.keys(exportData[0]);
    const csv = exportData.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
    csv.unshift(header.join(','));
    const csvArray = csv.join('\r\n');

    const a = document.createElement('a');
    const blob = new Blob([csvArray], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    a.href = url;
    a.setAttribute('download', 'logsReport.csv');
    document.body.appendChild(a);
    a.click();
  }

  onSelectAllQuestionnairesClicked(): void {
    const questionnairesNameArray = [];
    if (
      this.form.controls['questionnaires'].value[0] ===
        'allQuestionnairesCheckbox' &&
      this.form.controls['questionnaires'].value.length !==
        this.filteredQuestionnairesArray.length + 1
    ) {
      questionnairesNameArray.push('allQuestionnairesCheckbox');
      for (const questionnaire of this.filteredQuestionnairesArray) {
        questionnairesNameArray.push(questionnaire.id);
      }
    }
    this.form.controls['questionnaires'].setValue(questionnairesNameArray);
  }

  onSelectAllProbandsClicked(): void {
    const probandsNameArray = [];
    if (
      this.form.controls['probands'].value[0] === 'allProbandsCheckbox' &&
      this.form.controls['probands'].value.length !==
        this.filteredProbandsArray.length + 1
    ) {
      probandsNameArray.push('allProbandsCheckbox');
      for (const proband of this.filteredProbandsArray) {
        probandsNameArray.push(proband.username);
      }
    }
    this.form.controls['probands'].setValue(probandsNameArray);
  }
}
