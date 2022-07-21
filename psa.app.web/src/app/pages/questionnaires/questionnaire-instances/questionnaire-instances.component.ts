/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  AfterViewInit,
  Component,
  Directive,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../../_services/alert.service';
import { QuestionnaireInstancesOneUserDataSource } from '../../../_helpers/questionnaire-instances-for-one-user-data-source';
import { QuestionnaireInsancesOneUserDatabase } from '../../../_helpers/questionnaire-instances-for-one-user-database';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { fromEvent } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import {
  QuestionnaireInstance,
  QuestionnaireStatus,
} from '../../../psa.app.core/models/questionnaireInstance';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentUser } from '../../../_services/current-user.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  templateUrl: 'questionnaire-instances.component.html',
  styleUrls: ['questionnaire-instances.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
})
export class QuestionnaireInstancesComponent implements OnInit {
  username: string;

  constructor(
    public user: CurrentUser,
    private questionnaireService: QuestionnaireService,
    private activatedRoute: ActivatedRoute,
    private alertService: AlertService,
    private _location: Location,
    private translate: TranslateService,
    private router: Router
  ) {
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

  public async ngOnInit(): Promise<void> {
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

    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(debounceTime(150))
      .pipe(distinctUntilChanged())
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
