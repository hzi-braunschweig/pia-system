/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../../_services/alert.service';
import { QuestionnaireDataSource } from '../../../_helpers/questionnaire-data-source';
import { QuestionnaireDatabase } from '../../../_helpers/questionnaire-database';
import { DialogDeleteComponent } from '../../../_helpers/dialog-delete';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { Questionnaire } from '../../../psa.app.core/models/questionnaire';
import { DialogImportQuestionnaireComponentComponent } from './dialog-import-questionnaire-component/dialog-import-questionnaire-component.component';

@Component({
  templateUrl: 'questionnaires-researcher.component.html',
  styleUrls: ['questionnaires-researcher.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
  standalone: false,
})
export class QuestionnairesResearcherComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true })
  private readonly _paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) private readonly sort: MatSort;

  public displayedColumns = [
    'id',
    'version',
    'study_id',
    'sort_order',
    'name',
    'no_questions',
    'active',
    'updated_at',
    'delete',
  ];
  public isLoading: boolean;
  public dataSource: QuestionnaireDataSource | null;
  public selection = new SelectionModel<string>(true, []);
  private readonly questionnaireDatabase = new QuestionnaireDatabase(
    this.questionnaireService,
    this.alertService
  );

  public constructor(
    private readonly questionnaireService: QuestionnaireService,
    private readonly alertService: AlertService,
    private readonly router: Router,
    public dialog: MatDialog
  ) {}

  public ngOnInit(): void {
    this.dataSource = new QuestionnaireDataSource(
      this.questionnaireDatabase,
      this._paginator,
      this.sort
    );
    void this.loadData();
  }

  public applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  public createNewQuestionnaire(): void {
    void this.router.navigate(['/questionnaire']);
  }

  public editQuestionnaire(id: number, version: number): void {
    void this.router.navigate(['/questionnaire', id, version, 'edit']);
  }

  public openImportDialog(): void {
    const dialogRef = this.dialog.open(
      DialogImportQuestionnaireComponentComponent,
      {
        width: '800px',
      }
    );

    dialogRef.afterClosed().subscribe(() => {
      void this.loadData();
    });
  }

  public openDeleteDialog(id: number, version: number): void {
    const dialogRef = this.dialog.open(DialogDeleteComponent, {
      width: '400px',
      data: { data: `den Fragebogen ${id}, Version ${version}` },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.questionnaireDatabase.deleteQuestionnaire(id, version);
      }
    });
  }

  private async loadData(): Promise<void> {
    try {
      this.isLoading = true;
      const questionnaires: Questionnaire[] = await this.questionnaireService
        .getQuestionnaires()
        .then((result) => result.questionnaires);
      this.dataSource.insertData(questionnaires);
    } catch (err) {
      this.alertService.errorObject(err);
    } finally {
      this.isLoading = false;
    }
  }
}
