/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { DataService } from '../../../_services/data.service';
import { QuestionnaireInstance } from '../../../psa.app.core/models/questionnaireInstance';
import { MatTableDataSource } from '@angular/material/table';
import { compareQuestionnaireInstances } from './compare-questionnaire-instances';

@Component({
  selector: 'app-questionnaire-instances-list',
  templateUrl: './questionnaire-instances-list.component.html',
  styleUrls: ['./questionnaire-instances-list.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
})
export class QuestionnaireInstancesListComponent implements OnInit {
  constructor(private router: Router, private data: DataService) {}

  @Input() set questionnaireInstances(
    questionnaireInstances: QuestionnaireInstance[]
  ) {
    if (!questionnaireInstances) {
      return;
    }
    const instancesResult = questionnaireInstances.toSorted(
      compareQuestionnaireInstances
    );

    this.qDatasourceSpontan.data = instancesResult.filter(
      QuestionnaireInstancesListComponent.isForSpontanList
    );
    this.qDatasource.data = instancesResult.filter(
      (instance) =>
        !QuestionnaireInstancesListComponent.isForSpontanList(instance)
    );
  }

  readonly displayedColumns: string[] = [
    'status',
    'questionnaire_name',
    'progress',
    'date_of_issue',
  ];
  readonly qDatasource = new MatTableDataSource<QuestionnaireInstance>();
  readonly qDatasourceSpontan = new MatTableDataSource<QuestionnaireInstance>();

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private static isForSpontanList(instance): boolean {
    return (
      instance.questionnaire.cycle_unit === 'spontan' &&
      (instance.status === 'active' || instance.status === 'in_progress')
    );
  }

  ngOnInit(): void {
    this.qDatasource.paginator = this.paginator;
    this.qDatasource.sort = this.sort;
  }

  applyFilter(filterValue: string): void {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.qDatasource.filter = filterValue;
    this.qDatasourceSpontan.filter = filterValue;
  }

  editOrViewQuestionnaire(
    questionnaireId: number,
    questionnaireInstanceId: number,
    status: string
  ): void {
    this.data.changeQuestionnaireInstanceStatus(status.toString());
    this.router.navigate([
      '/questionnaire',
      questionnaireId,
      questionnaireInstanceId,
    ]);
  }
}
