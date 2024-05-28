/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LabResult } from '../../../psa.app.core/models/labresult';
import { Router } from '@angular/router';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { Location } from '@angular/common';
import { AlertService } from '../../../_services/alert.service';

@Component({
  selector: 'app-laboratory-results-list',
  templateUrl: './laboratory-results-list.component.html',
  styleUrls: ['laboratory-results-list.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
})
export class LaboratoryResultsListComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  @Input() labResultsList: LabResult[];

  @Input() user_id: string;

  isLoading = false;
  dataSource: MatTableDataSource<LabResult>;
  displayedColumns = ['id', 'date_of_sampling', 'action'];

  constructor(
    private _location: Location,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.dataSource = new MatTableDataSource(this.labResultsList);
    this.dataSource.sort = this.sort;
    this.isLoading = false;
    this.applyFilter('');
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(filterValue: string): void {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  backClicked(): void {
    this._location.back();
  }

  onLaboratoryResultItemClicked(labor_result: string): void {
    this.router.navigate(['/laboratory-results', labor_result], {
      queryParams: { user_id: this.user_id },
      skipLocationChange: true,
    });
  }
}
