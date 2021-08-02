/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UserWithStudyAccess } from '../../app/psa.app.core/models/user-with-study-access';
import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject } from 'rxjs';
import { InternalUsersDatabase } from './internal-users-database';
/**
 * Data source to provide what data should be rendered in the table. Note that the data source
 * can retrieve its data in any way. In this case, the data source is provided a reference
 * to a common data base, QuestionnaireDatabase. It is not the data source's responsibility to manage
 * the underlying data. Instead, it only needs to take the data and send the table exactly what
 * should be rendered.
 */
export class InternalUsersDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');
  get filter(): string {
    return this._filterChange.value;
  }
  set filter(filter: string) {
    this._filterChange.next(filter);
  }

  filteredData: UserWithStudyAccess[] = [];
  renderedData: UserWithStudyAccess[] = [];

  constructor(
    private _internalUsersDatabase: InternalUsersDatabase,
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
      this._internalUsersDatabase.dataChange,
      this._sort.sortChange,
      this._filterChange,
      this._paginator.page,
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      this.filteredData = this._internalUsersDatabase.data
        .slice()
        .filter((item: UserWithStudyAccess) => {
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
    });
  }

  buildItemString(item: UserWithStudyAccess): string {
    const str = item.username + item.role + item.first_logged_in_at;
    return str.toLowerCase();
  }

  insertData(users): void {
    this._internalUsersDatabase.insertData(users);
  }

  disconnect(): void {}

  /** Returns a sorted copy of the database data. */
  sortData(data: UserWithStudyAccess[]): UserWithStudyAccess[] {
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';

      switch (this._sort.active) {
        case 'username':
          [propertyA, propertyB] = [
            a.username.toLowerCase(),
            b.username.toLowerCase(),
          ];
          break;
        case 'first_logged_in_at':
          [propertyA, propertyB] = [a.first_logged_in_at, b.first_logged_in_at];
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
