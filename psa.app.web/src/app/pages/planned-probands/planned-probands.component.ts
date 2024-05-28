/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

import { PlannedProband } from '../../psa.app.core/models/plannedProband';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { DataService } from '../../_services/data.service';
import { DialogDeleteComponent } from '../../_helpers/dialog-delete';
import { DialogNewPlannedProbandsComponent } from 'src/app/dialogs/new-planned-probands-dialog/new-planned-probands-dialog.component';
import { MatPaginatorIntlGerman } from '../../_helpers/mat-paginator-intl';
import { PlannedProbandStudyAccess } from '../../psa.app.core/models/studyAccess';
import { format } from 'date-fns';

@Component({
  selector: 'app-planned-probands',
  templateUrl: './planned-probands.component.html',
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
})
export class PlannedProbandsComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) public paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) public sort: MatSort;

  public dataSource: MatTableDataSource<PlannedProband>;
  public displayedColumns = [
    'select',
    'user_id',
    'study_id',
    'activated_at',
    'delete',
  ];
  public filterFormControl = new FormControl('');
  public selection = new SelectionModel(true, []);
  public isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    private router: Router,
    private dataService: DataService,
    public dialog: MatDialog
  ) {
    this.filterFormControl.valueChanges
      .pipe(debounceTime(150))
      .pipe(distinctUntilChanged())
      .pipe(filter(() => !!this.dataSource))
      .subscribe((value) => (this.dataSource.filter = value));
  }

  public async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    const plannedProbands = await this.authService.getPlannedProbands();
    this.setPlannedProbandsStatus(plannedProbands);
    this.setPlannedProbandsStudies(plannedProbands);
    this.dataSource = new MatTableDataSource(plannedProbands);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.isLoading = false;
  }

  private setPlannedProbandsStatus(plannedProbands: PlannedProband[]): void {
    plannedProbands.forEach((plannedProband: PlannedProband) => {
      plannedProband.activated_at = plannedProband.activated_at
        ? this.translate.instant('PLANNED_PROBANDS.ACTIVATED_AT') +
          format(new Date(plannedProband.activated_at), 'dd.MM.yy HH:mm')
        : this.translate.instant('PLANNED_PROBANDS.IN_PLANNING');
    });
  }

  private setPlannedProbandsStudies(plannedProbands: PlannedProband[]): void {
    plannedProbands.forEach((plannedProband: PlannedProband) => {
      plannedProband.studies = plannedProband.study_accesses
        .map((access: PlannedProbandStudyAccess) => access.study_id)
        .toString();
    });
  }

  resetFilter(): void {
    this.dataSource.filter = '';
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.filteredData.forEach((row) =>
          this.selection.select(row)
        );
  }

  createLetters(plannedProbands?: PlannedProband[]): void {
    const forPlannedProbands = plannedProbands
      ? plannedProbands
      : this.selection.selected;
    if (forPlannedProbands.length > 0) {
      this.dataService.setPlannedProbandsForLetters(forPlannedProbands);
      this.router.navigate(['/collective-login-letters']);
    }
  }

  addPlannedProbands(): void {
    const dialogRef = this.dialog.open(DialogNewPlannedProbandsComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.createLetters(result);
      } else {
        this.loadData();
      }
    });
  }

  openDeleteDialog(user_id: string): void {
    const dialogRef = this.dialog.open(DialogDeleteComponent, {
      width: '500px',
      data: { data: 'den geplanten Probanden ' + user_id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.authService.deletePlannedProband(user_id).then(() => {
          this.loadData();
        });
      }
    });
  }
}
