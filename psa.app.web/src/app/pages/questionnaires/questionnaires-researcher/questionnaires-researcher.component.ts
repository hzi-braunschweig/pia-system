/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../../_services/alert.service';
import { QuestionnaireDataSource } from '../../../_helpers/questionnaire-data-source';
import { QuestionnaireDatabase } from '../../../_helpers/questionnaire-database';
import { DialogDeleteComponent } from '../../../_helpers/dialog-delete';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { MediaObserver } from '@angular/flex-layout';
import { Questionnaire } from '../../../psa.app.core/models/questionnaire';
import { map, startWith } from 'rxjs/operators';

@Component({
  templateUrl: 'questionnaires-researcher.component.html',
  styleUrls: ['questionnaires-researcher.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
})
export class QuestionnairesResearcherComponent implements OnInit {
  constructor(
    private questionnaireService: QuestionnaireService,
    private alertService: AlertService,
    private router: Router,
    private translate: TranslateService,
    private mediaObserver: MediaObserver,
    public dialog: MatDialog
  ) {}

  displayedColumns = [
    'id',
    'version',
    'study_id',
    'name',
    'no_questions',
    'active',
    'updated_at',
    'delete',
  ];
  questionnaireDatabase = new QuestionnaireDatabase(
    this.questionnaireService,
    this.alertService
  );
  dataSource: QuestionnaireDataSource | null;
  selection = new SelectionModel<string>(true, []);
  @ViewChild(MatPaginator, { static: true }) _paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('delete') delete: ElementRef;
  public cols: Observable<number>;
  questionnaires: Questionnaire[];
  isLoading: boolean = true;

  ngOnInit(): void {
    this.dataSource = new QuestionnaireDataSource(
      this.questionnaireDatabase,
      this._paginator,
      this.sort
    );

    this.questionnaireService.getQuestionnaires().then(
      (result) => {
        this.questionnaires = result.questionnaires;
        this.loadData();
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );

    const grid = new Map([
      ['xs', 1],
      ['sm', 2],
      ['md', 2],
      ['lg', 2],
      ['xl', 2],
    ]);
    let start: number;

    grid.forEach((cols, mqAlias) => {
      if (this.mediaObserver.isActive(mqAlias)) {
        start = cols;
      }
    });

    this.cols = this.mediaObserver.media$
      .pipe(map((change) => grid.get(change.mqAlias)))
      .pipe(startWith(start));
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  loadData(): void {
    this.dataSource.insertData(this.questionnaires);
    this.isLoading = false;
  }

  createNewQuestionnaire(): void {
    this.router.navigate(['/questionnaire']);
  }

  editQuestionnaire(id: number, version: number): void {
    this.router.navigate(['/questionnaire', id, version, 'edit']);
  }

  openDialog(id: number, version: number): void {
    const dialogRef = this.dialog.open(DialogDeleteComponent, {
      width: '400px',
      data: { data: 'den Fragebogen ' + id + ', Version ' + version },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.questionnaireDatabase.deleteQuestionnaire(id, version);
      }
    });
  }
}
