/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { UserWithStudyAccess } from '../../app/psa.app.core/models/user-with-study-access';
import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject } from 'rxjs';
import { ProbandsDatabase } from './probands-database';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
/**
 * Data source to provide what data should be rendered in the table. Note that the data source
 * can retrieve its data in any way. In this case, the data source is provided a reference
 * to a common data base, QuestionnaireDatabase. It is not the data source's responsibility to manage
 * the underlying data. Instead, it only needs to take the data and send the table exactly what
 * should be rendered.
 */
export class ProbandsDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');
  get filter(): string {
    return this._filterChange.value;
  }
  set filter(filter: string) {
    this._filterChange.next(filter);
  }

  testProbandFilter: String = 'both';
  filteredData: UserWithStudyAccess[] = [];
  renderedData: UserWithStudyAccess[] = [];

  constructor(
    private _probandsDatabase: ProbandsDatabase,
    private _paginator: MatPaginator,
    private _sort: MatSort
  ) {
    super();

    // Reset to the first page when the user changes the filter.
    this._filterChange.subscribe(() => (this._paginator.pageIndex = 0));
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<UserWithStudyAccess[]> {
    const displayDataChanges = [
      this._probandsDatabase.dataChange,
      this._sort.sortChange,
      this._filterChange,
      this._paginator.page,
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      // Filter data
      this.filteredData = this._probandsDatabase.data
        ? this._probandsDatabase.data
            .slice()
            .filter((item: UserWithStudyAccess) => {
              const searchStr = this.buildItemString(item);
              if (this.testProbandFilter === 'both') {
                return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
              } else if (this.testProbandFilter === 'true') {
                return (
                  item.is_test_proband === true &&
                  searchStr.indexOf(this.filter.toLowerCase()) !== -1
                );
              } else if (this.testProbandFilter === 'false') {
                return (
                  item.is_test_proband === false &&
                  searchStr.indexOf(this.filter.toLowerCase()) !== -1
                );
              }
            })
        : [];

      // Sort filtered data
      const sortedData = this.sortData(this.filteredData.slice());

      // Grab the page's slice of the filtered sorted data.
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      this.renderedData = sortedData.splice(
        startIndex,
        this._paginator.pageSize
      );
      return this.renderedData;
    });
  }

  buildItemString(item: UserWithStudyAccess) {
    const str =
      item.username +
      item.studyNamesArray +
      item.role +
      item.first_logged_in_at +
      item.ids;
    return str.toLowerCase();
  }

  insertData(probands) {
    this._probandsDatabase.insertData(probands);
  }

  disconnect() {}

  /** Returns a sorted copy of the database data. */
  sortData(data: UserWithStudyAccess[]): UserWithStudyAccess[] {
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      let propertyA: number | string | boolean = '';
      let propertyB: number | string | boolean = '';

      switch (this._sort.active) {
        case 'username':
          [propertyA, propertyB] = [
            a.ids === a.username ? '' : a.username.toLowerCase(),
            b.ids === b.username ? '' : b.username.toLowerCase(),
          ];
          break;
        case 'ids':
          [propertyA, propertyB] = [
            a.ids ? a.ids.toLowerCase() : '',
            b.ids ? b.ids.toLowerCase() : '',
          ];
          break;
        case 'first_logged_in_at':
          [propertyA, propertyB] = [a.first_logged_in_at, b.first_logged_in_at];
          break;
        case 'is_test_proband':
          [propertyA, propertyB] = [a.is_test_proband, b.is_test_proband];
          break;
        case 'account_status':
          [propertyA, propertyB] = [a.account_status, b.account_status];
          break;
        case 'studyNamesArray':
          [propertyA, propertyB] = [
            a.study_accesses.toString(),
            b.study_accesses.toString(),
          ];
          break;
      }

      const valueA = propertyA; // isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = propertyB; // isNaN(+propertyB) ? propertyB : +propertyB;

      return (
        (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1)
      );
    });
  }
}
