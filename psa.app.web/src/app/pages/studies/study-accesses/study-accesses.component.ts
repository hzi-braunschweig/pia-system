/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AlertService } from '../../../_services/alert.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DialogDeleteComponent } from '../../../_helpers/dialog-delete';
import {
  DialogUserStudyAccessComponent,
  DialogUserStudyAccessComponentData,
  DialogUserStudyAccessComponentReturn,
} from '../../../dialogs/user-study-dialog/user-study-dialog';
import {
  DialogUserEditComponent,
  DialogUserEditComponentData,
  DialogUserEditComponentReturn,
} from '../../../dialogs/user-edit-dialog/user-edit-dialog';
import { Study } from '../../../psa.app.core/models/study';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { MatTableDataSource } from '@angular/material/table';
import { AccessLevel } from '../../../psa.app.core/models/studyAccess';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';

interface TableRow {
  username: string;
  role: string;
  accessLevel: AccessLevel;
}

@Component({
  templateUrl: 'study-accesses.component.html',
  styleUrls: ['study-accesses.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
})
export class StudyAccessesComponent implements OnInit {
  public study: Study;

  public displayedColumns = ['username', 'role', 'accessLevel', 'edit'];
  public dataSource: MatTableDataSource<TableRow> =
    new MatTableDataSource<TableRow>();
  public isLoading = false;
  @ViewChild(MatPaginator, { static: true })
  public paginator: MatPaginator;
  @ViewChild(MatSort, { static: true })
  public sort: MatSort;

  constructor(
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private alertService: AlertService,
    public dialog: MatDialog,
    private location: Location
  ) {}

  public async ngOnInit(): Promise<void> {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    await this.initTable();
  }

  private async initTable(): Promise<void> {
    this.isLoading = true;
    try {
      const studyName = this.activatedRoute.snapshot.paramMap.get('name');
      this.study = await this.userService.getStudy(studyName);
      const accounts = await this.userService.getProfessionalAccounts({
        studyName,
      });
      const studyAccesses = await this.userService.getStudyAccesses(studyName);
      this.dataSource.data = accounts.map((account) => ({
        username: account.username,
        role: account.role,
        accessLevel: studyAccesses.find(
          (access) => access.username === account.username
        )?.accessLevel,
      }));
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
  }

  public backClicked(): void {
    this.location.back();
  }

  public openDeleteStudyAccessDialog(row: TableRow): void {
    const dialogRef = this.dialog.open(DialogDeleteComponent, {
      width: '500px',
      data: {
        data: ' 	den Nutzer ' + row.username + ' aus Studie ' + this.study.name,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.deleteUserFromStudy(row.username);
      }
    });
  }

  private async deleteUserFromStudy(username: string): Promise<void> {
    try {
      await this.userService.deleteUserFromStudy(username, this.study.name);
      this.dataSource.data = this.dataSource.data.filter(
        (d) => d.username !== username
      );
    } catch (err) {
      this.alertService.errorObject(err, 'DIALOG.STUDY_ACCESS_DELETE_ERR');
    }
  }

  public openAddStudyAccessDialog(): void {
    const dialogRef = this.dialog.open<
      DialogUserStudyAccessComponent,
      DialogUserStudyAccessComponentData,
      DialogUserStudyAccessComponentReturn
    >(DialogUserStudyAccessComponent, {
      width: '700px',
      data: { studyName: this.study.name },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.initTable();
      }
    });
  }

  public openEditStudyAccessDialog(row: TableRow): void {
    const dialogRef = this.dialog.open<
      DialogUserEditComponent,
      DialogUserEditComponentData,
      DialogUserEditComponentReturn
    >(DialogUserEditComponent, {
      width: '500px',
      data: {
        studyName: this.study.name,
        username: row.username,
        accessLevel: row.accessLevel,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.initTable();
      }
    });
  }
}
