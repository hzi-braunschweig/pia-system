import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject } from 'rxjs';
import { StudyUsersDatabase } from './study-users-database';
import { StudyAccess } from '../psa.app.core/models/study_access';

/**
 * Data source to provide what data should be rendered in the table. Note that the data source
 * can retrieve its data in any way. In this case, the data source is provided a reference
 * to a common data base, QuestionnaireDatabase. It is not the data source's responsibility to manage
 * the underlying data. Instead, it only needs to take the data and send the table exactly what
 * should be rendered.
 */
export class StudyUsersDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');

  get filter(): string {
    return this._filterChange.value;
  }

  set filter(filter: string) {
    this._filterChange.next(filter);
  }

  filteredData: StudyAccess[] = [];
  renderedData: StudyAccess[] = [];

  constructor(
    private _studyUsersDatabase: StudyUsersDatabase,
    private _paginator: MatPaginator,
    private _sort: MatSort
  ) {
    super();

    // Reset to the first page when the user changes the filter.
    this._filterChange.subscribe(() => (this._paginator.pageIndex = 0));
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<StudyAccess[]> {
    const displayDataChanges = [
      this._studyUsersDatabase.dataChange,
      this._sort.sortChange,
      this._filterChange,
      this._paginator.page,
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      this.filteredData = this._studyUsersDatabase.data
        .slice()
        .filter((item: StudyAccess) => {
          const searchStr = item.study_id.toLowerCase();
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

  disconnect(): void {}

  /** Returns a sorted copy of the database data. */
  sortData(data: StudyAccess[]): StudyAccess[] {
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';

      switch (this._sort.active) {
        case 'study_id':
          [propertyA, propertyB] = [
            a.study_id.toLowerCase(),
            b.study_id.toLowerCase(),
          ];
          break;
        case 'user_id':
          [propertyA, propertyB] = [a.user_id, b.user_id];
          break;
        case 'access_level':
          [propertyA, propertyB] = [a.access_level, b.access_level];
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
