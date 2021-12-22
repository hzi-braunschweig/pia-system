/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../_services/alert.service';
import { DialogDeleteComponent } from '../../_helpers/dialog-delete';
import { MatDialog } from '@angular/material/dialog';
import { DialogUserDataComponent } from '../../_helpers/dialog-user-data';
import { DialogNewUserComponent } from '../../dialogs/new-user-dialog/new-user-dialog.component';
import { MatPaginatorIntlGerman } from '../../_helpers/mat-paginator-intl';
import {
  ProfessionalRole,
  ProfessionalUser,
} from '../../psa.app.core/models/user';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  templateUrl: 'internal-users.component.html',
  styleUrls: ['internal-users.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
})
export class InternalUsersComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) private sort: MatSort;
  private professionalUsers: ProfessionalUser[] = [];
  public roles: { value: ProfessionalRole; viewValue: string }[] = [
    { value: 'Forscher', viewValue: 'ROLES.RESEARCHER' },
    { value: 'ProbandenManager', viewValue: 'ROLES.PROBANDS_MANAGER' },
    { value: 'EinwilligungsManager', viewValue: 'ROLES.COMPLIANCE_MANAGER' },
    { value: 'Untersuchungsteam', viewValue: 'ROLES.RESEARCH_TEAM' },
  ];
  public dataSource: MatTableDataSource<ProfessionalUser> =
    new MatTableDataSource<ProfessionalUser>();
  public displayedColumns = ['username', 'role', 'view'];
  public currentRole?: ProfessionalRole;
  public filterKeyword: string = '';
  public isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    public dialog: MatDialog
  ) {}

  public async ngOnInit(): Promise<void> {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    await this.loadData();
  }

  public initTable(): void {
    this.dataSource.data = this.professionalUsers.filter(
      (user) => user.role === this.currentRole
    );
  }

  public applyFilter(): void {
    this.dataSource.filter = this.filterKeyword.trim().toLowerCase();
  }

  public resetFilter(): void {
    this.dataSource.data = [];
    this.dataSource.filter = '';
    this.currentRole = undefined;
    this.filterKeyword = '';
  }

  public addUser(): void {
    this.dialog
      .open<DialogNewUserComponent, null, ProfessionalUser>(
        DialogNewUserComponent,
        {
          width: '700px',
        }
      )
      .afterClosed()
      .subscribe((result) => {
        if (result !== undefined) {
          this.dialog
            .open<DialogUserDataComponent, ProfessionalUser>(
              DialogUserDataComponent,
              {
                width: '500px',
                data: result,
              }
            )
            .afterClosed()
            .subscribe(() => {
              this.loadData();
            });
        }
      });
  }

  public openDialog(username: string): void {
    const dialogRef = this.dialog.open(DialogDeleteComponent, {
      width: '500px',
      data: { data: 'den Nutzer ' + username },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.deleteUser(username);
      }
    });
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      this.professionalUsers = await this.authService.getProfessionalUsers();
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.initTable();
    this.isLoading = false;
  }

  private async deleteUser(username: string): Promise<void> {
    try {
      await this.authService.deleteUser(username);
      await this.loadData();
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }
}
