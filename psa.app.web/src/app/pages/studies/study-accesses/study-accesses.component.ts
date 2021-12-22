/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
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
import { AccessLevel } from '../../../psa.app.core/models/study_access';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';

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
    private questionnaireService: QuestionnaireService,
    private authService: AuthService,
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
    const data: TableRow[] = [];
    try {
      const studyName = this.activatedRoute.snapshot.paramMap.get('name');
      this.study = await this.questionnaireService.getStudy(studyName);
      const users = await this.authService.getProfessionalUsers();
      users.forEach((user) => {
        const access = user.study_accesses.find(
          (a) => a.study_id === studyName
        );
        if (access) {
          data.push({
            username: user.username,
            role: user.role,
            accessLevel: access.access_level,
          });
        }
      });
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.dataSource.data = data;
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
      await this.questionnaireService.deleteUserFromStudy(
        username,
        this.study.name
      );
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
