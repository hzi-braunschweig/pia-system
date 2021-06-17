import {
  Component,
  ElementRef,
  ViewChild,
  Directive,
  AfterViewInit,
  Input,
  OnInit,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../../_services/alert.service';
import { QuestionnaireInstancesOneUserDataSource } from '../../../_helpers/questionnaire-instances-for-one-user-data-source';
import { QuestionnaireInsancesOneUserDatabase } from '../../../_helpers/questionnaire-instances-for-one-user-database';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../../../psa.app.core/models/user';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { forwardRef } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import {
  QuestionnaireInstance,
  QuestionnaireStatus,
} from '../../../psa.app.core/models/questionnaireInstance';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  templateUrl: 'questionnaire-instances.component.html',
  styleUrls: ['questionnaire-instances.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: forwardRef(() => MatPaginatorIntlGerman),
    },
  ],
})
export class QuestionnaireInstancesComponent implements OnInit {
  username: string;
  currentRole: string;

  constructor(
    private questionnaireService: QuestionnaireService,
    private activatedRoute: ActivatedRoute,
    private alertService: AlertService,
    private _location: Location,
    private translate: TranslateService,
    private router: Router
  ) {
    const jwtHelper: JwtHelperService = new JwtHelperService();
    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));
    // decode the token to get its payload
    const tokenPayload = jwtHelper.decodeToken(currentUser.token);
    this.currentRole = tokenPayload.role;
    if ('username' in this.activatedRoute.snapshot.params) {
      this.username = this.activatedRoute.snapshot.paramMap.get('username');
    }
  }

  displayedColumns = [
    'questionnaire_id',
    'study_id',
    'name',
    'date',
    'status',
    'edit',
  ];
  questionnaireDatabase: QuestionnaireInsancesOneUserDatabase | null;
  dataSource: QuestionnaireInstancesOneUserDataSource | null;
  @ViewChild(MatPaginator, { static: true }) _paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('filter', { static: true }) filter: ElementRef;
  isLoading: boolean = true;
  questionnaireInstances: QuestionnaireInstance[];

  ngOnInit(): void {
    this.questionnaireDatabase = new QuestionnaireInsancesOneUserDatabase();
    this.dataSource = new QuestionnaireInstancesOneUserDataSource(
      this.questionnaireDatabase,
      this._paginator,
      this.sort,
      this.translate
    );

    this.questionnaireService
      .getQuestionnaireInstancesForUser(this.username)
      .then(
        (questionnaireInstances: QuestionnaireInstance[]) => {
          this.questionnaireInstances = questionnaireInstances;
          this.dataSource.insertData(this.questionnaireInstances);
          this.isLoading = false;
        },
        (err: HttpErrorResponse) => {
          this.alertService.errorObject(err);
        }
      );

    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
  }

  viewAnswers(
    questionnaireId: number,
    questionnaireInstanceId: number,
    status: QuestionnaireStatus
  ): void {
    if (
      status === 'released' ||
      status === 'released_once' ||
      status === 'released_twice'
    ) {
      this.router.navigate([
        'questionnaire',
        questionnaireId,
        questionnaireInstanceId,
      ]);
    }
  }

  backClicked(): void {
    this._location.back();
  }
}

@Directive({
  selector: '[appShowColumn]',
})
export class ShowColumnDirective implements AfterViewInit {
  @Input() showInput: string;

  constructor(private elRef: ElementRef) {}

  ngAfterViewInit(): void {
    this.elRef.nativeElement.style.display = this.showInput;
  }
}
