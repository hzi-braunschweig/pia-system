/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { QuestionnaireInstance } from '../../app/psa.app.core/models/questionnaireInstance';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { QuestionnaireInsancesOneUserDatabase } from './questionnaire-instances-for-one-user-database';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

/**
 * Data source to provide what data should be rendered in the table. Note that the data source
 * can retrieve its data in any way. In this case, the data source is provided a reference
 * to a common data base, QuestionnaireDatabase. It is not the data source's responsibility to manage
 * the underlying data. Instead, it only needs to take the data and send the table exactly what
 * should be rendered.
 */
export class QuestionnaireInstancesOneUserDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');
  get filter(): string {
    return this._filterChange.value;
  }
  set filter(filter: string) {
    this._filterChange.next(filter);
  }

  filteredData: QuestionnaireInstance[] = [];
  renderedData: QuestionnaireInstance[] = [];

  constructor(
    private _questionnaireDatabase: QuestionnaireInsancesOneUserDatabase,
    private _paginator: MatPaginator,
    private _sort: MatSort,
    private translate: TranslateService
  ) {
    super();

    // Reset to the first page when the user changes the filter.
    this._filterChange.subscribe(() => (this._paginator.pageIndex = 0));
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<QuestionnaireInstance[]> {
    const displayDataChanges = [
      this._questionnaireDatabase.dataChange,
      this._sort.sortChange,
      this._filterChange,
      this._paginator.page,
    ];

    return merge(...displayDataChanges).pipe(
      map(() => {
        // Filter data
        this.filteredData = this._questionnaireDatabase.data
          .slice()
          .filter((item: QuestionnaireInstance) => {
            const searchStr = this.buildItemString(item);
            return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
          });

        // Sort filtered data
        const sortedData = this.sortData(this.filteredData.slice());

        // Grab the page's slice of the filtered sorted data.
        const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
        this.renderedData = sortedData.splice(
          startIndex,
          this._paginator.pageSize
        );
        return this.renderedData;
      })
    );
  }

  buildItemString(item: QuestionnaireInstance): string {
    const str =
      item.study_id +
      item.questionnaire_name +
      this.translate.instant(item.status) +
      item.date_of_issue;
    return str.toLowerCase();
  }

  insertData(instances): void {
    this._questionnaireDatabase.insertData(instances);
  }

  disconnect(): void {}

  /** Returns a sorted copy of the database data. */
  sortData(data: QuestionnaireInstance[]): QuestionnaireInstance[] {
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      let propertyA: number | string | Date = '';
      let propertyB: number | string | Date = '';

      switch (this._sort.active) {
        case 'questionnaire_id':
          [propertyA, propertyB] = [a.questionnaire_id, b.questionnaire_id];
          break;
        case 'study_id':
          [propertyA, propertyB] = [a.study_id, b.study_id];
          break;
        case 'name':
          [propertyA, propertyB] = [
            a.questionnaire_name.toLowerCase(),
            b.questionnaire_name.toLowerCase(),
          ];
          break;
        case 'status':
          [propertyA, propertyB] = [a.status, b.status];
          break;
        case 'no_question':
          [propertyA, propertyB] = [a.status, b.status];
          break;
        case 'date':
          [propertyA, propertyB] = [a.date_of_issue, b.date_of_issue];
          break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (
        (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1)
      );
    });
  }
}
