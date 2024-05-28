/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Questionnaire } from '../psa.app.core/models/questionnaire';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, merge, Observable } from 'rxjs';
import { QuestionnaireDatabase } from './questionnaire-database';
import { map } from 'rxjs/operators';

/**
 * Data source to provide what data should be rendered in the table. Note that the data source
 * can retrieve its data in any way. In this case, the data source is provided a reference
 * to a common data base, QuestionnaireDatabase. It is not the data source's responsibility to manage
 * the underlying data. Instead, it only needs to take the data and send the table exactly what
 * should be rendered.
 */
export class QuestionnaireDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');

  get filter(): string {
    return this._filterChange.value;
  }

  set filter(filter: string) {
    this._filterChange.next(filter);
  }

  filteredData: Questionnaire[] = [];
  renderedData: Questionnaire[] = [];

  constructor(
    private _questionnaireDatabase: QuestionnaireDatabase,
    private _paginator: MatPaginator,
    private _sort: MatSort
  ) {
    super();

    // Reset to the first page when the user changes the filter.
    this._filterChange.subscribe(() => (this._paginator.pageIndex = 0));
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<Questionnaire[]> {
    const displayDataChanges = [
      this._questionnaireDatabase.dataChange,
      this._sort.sortChange,
      this._filterChange,
      this._paginator.page,
    ];

    return merge(...displayDataChanges).pipe(
      map(() => {
        this.filteredData = this._questionnaireDatabase.data
          .slice()
          .filter((item: Questionnaire) => {
            const searchStr = this.buildItemString(item);
            return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
          });

        const sortedData = this.sortData(this.filteredData.slice());
        const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
        this.renderedData = sortedData.splice(
          startIndex,
          this._paginator.pageSize
        );
        return this.renderedData;
      })
    );
  }

  buildItemString(item: Questionnaire): string {
    const str =
      item.id.toString() +
      item.version.toString() +
      item.study_id +
      item.name +
      item.no_questions.toString() +
      item.active.toString() +
      (item.updated_at ?? '').toString();
    return str.toLowerCase();
  }

  insertData(questionnaires): void {
    this._questionnaireDatabase.insertData(questionnaires);
  }

  disconnect(): void {}

  /** Returns a sorted copy of the database data. */
  sortData(data: Questionnaire[]): Questionnaire[] {
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';

      switch (this._sort.active) {
        case 'id':
          [propertyA, propertyB] = [a.id, b.id];
          break;
        case 'version':
          [propertyA, propertyB] = [a.version, b.version];
          break;
        case 'study_id':
          [propertyA, propertyB] = [a.study_id, b.study_id];
          break;
        case 'name':
          [propertyA, propertyB] = [a.name.toLowerCase(), b.name.toLowerCase()];
          break;
        case 'no_questions':
          [propertyA, propertyB] = [a.no_questions, b.no_questions];
          break;
        case 'active':
          [propertyA, propertyB] = [Number(a.active), Number(b.active)];
          break;
        case 'updated_at':
          [propertyA, propertyB] = [
            new Date(a.updated_at).getTime(),
            new Date(b.updated_at).getTime(),
          ];
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (
        (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1)
      );
    });
  }
}
