/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../../_services/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Study } from '../../../psa.app.core/models/study';
import { DialogDeleteComponent } from '../../../_helpers/dialog-delete';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogStudyComponent } from 'src/app/dialogs/study-dialog/study-dialog';
import {
  DialogPopUpComponent,
  DialogPopUpData,
} from '../../../_helpers/dialog-pop-up';
import {
  DeletionType,
  DialogDeletePartnerComponent,
  DialogDeletePartnerData,
  DialogDeletePartnerResult,
} from '../../../_helpers/dialog-delete-partner';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { DialogChangeStudyComponent } from 'src/app/dialogs/dialog-change-study/dialog-change-study.component';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrentUser } from '../../../_services/current-user.service';
import { isSpecificHttpError } from '../../../psa.app.core/models/specificHttpError';
import { DialogYesNoComponent } from '../../../_helpers/dialog-yes-no';
import { filter } from 'rxjs/operators';

@Component({
  templateUrl: 'studies.component.html',
  styleUrls: ['studies.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
})
export class StudiesComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true })
  private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true })
  private sort: MatSort;

  public displayedColumns = ['name', 'description', 'status', 'view'];
  public dataSource = new MatTableDataSource<Study>();
  public isLoading = false;
  public filterKeyword = new FormControl('');

  constructor(
    public readonly user: CurrentUser,
    private readonly userService: UserService,
    private readonly alertService: AlertService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly dialog: MatDialog
  ) {}

  public async ngOnInit(): Promise<void> {
    this.filterKeyword.valueChanges.subscribe(
      (value) => (this.dataSource.filter = value.trim().toLowerCase())
    );
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    await this.initTable();
    await this.getAndOpenPendingDeletion();
    this.getAndOpenPendingChange();
  }

  private async getAndOpenPendingDeletion(): Promise<void> {
    const pendingDeletionId = Number(
      this.activatedRoute.snapshot.queryParamMap.get('pendingDeletionId')
    );
    const type = this.activatedRoute.snapshot.queryParamMap.get(
      'type'
    ) as DeletionType;

    if (!pendingDeletionId || type !== 'study') {
      return;
    }
    try {
      const pendingDeletion = await this.authService.getPendingDeletion(
        pendingDeletionId
      );
      this.openDialogDeletePartner(
        pendingDeletion.for_id,
        type,
        pendingDeletion.requested_by,
        pendingDeletion.id
      );
    } catch (err) {
      if (!(err instanceof HttpErrorResponse)) {
        this.alertService.errorObject(err);
      } else if (
        err.error.message ===
        'The requester is not allowed to get this pending deletion'
      ) {
        this.showResultDialog({
          content: 'PROBANDEN.PENDING_DELETE_ERROR',
          isSuccess: false,
        });
      } else if (err.error.message === 'The pending deletion was not found') {
        this.showResultDialog({
          content: 'PROBANDEN.PENDING_DELETION_NOT_FOUND',
          isSuccess: false,
        });
      } else if (
        err.error.message ===
        'Could not get the pending deletion: Unknown or wrong role'
      ) {
        this.showResultDialog({
          content: 'PROBANDEN.PENDING_DELETION_WRONG_ROLE',
          isSuccess: false,
        });
      } else {
        this.alertService.errorObject(err);
      }
    }
  }

  private getAndOpenPendingChange(): void {
    const pendingStudyChangeId = Number(
      this.activatedRoute.snapshot.queryParamMap.get('pendingStudyChangeId')
    );
    if (pendingStudyChangeId) {
      const correspondingStudy = this.dataSource.data.find(
        (study) =>
          study.pendingStudyChange &&
          study.pendingStudyChange.id === pendingStudyChangeId
      );

      if (
        correspondingStudy &&
        correspondingStudy.pendingStudyChange &&
        correspondingStudy.pendingStudyChange.requested_for ===
          this.user.username
      ) {
        this.openDialogChangeStudy(correspondingStudy);
      }
    }
  }

  private async initTable(): Promise<void> {
    this.isLoading = true;
    this.dataSource.data = [];
    try {
      this.dataSource.data = await this.userService.getStudies();
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
  }

  viewAllUsersInStudy(name: string): void {
    this.router.navigate(['/studies', name, 'users']);
  }

  addOrEditStudy(studyName?: string): void {
    const dialogRef = this.dialog.open(DialogStudyComponent, {
      width: '500px',
      data: { name: studyName },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.initTable();
      }
    });
  }

  public openDialogChangeStudy(study: Study): void {
    this.dialog
      .open(DialogChangeStudyComponent, {
        width: study.pendingStudyChange ? '1100px' : '700px',
        height: 'auto',
        data: { study },
      })
      .afterClosed()
      .pipe(filter((result) => !!result))
      .subscribe((result) => {
        if (result === 'rejected') {
          this.showResultDialog({
            content: 'STUDIES.CHANGE_COMPLIANCES_REJECTED',
            isSuccess: false,
          });
        } else if (result === 'accepted') {
          this.showResultDialog({
            content: 'STUDIES.CHANGE_COMPLIANCES_ACCEPTED',
            isSuccess: true,
          });
        } else if (result === 'requested') {
          this.showResultDialog({
            content: 'STUDIES.CHANGE_COMPLIANCES_REQUESTED',
            isSuccess: true,
          });
        } else {
          this.showResultDialog({
            content: this.getErrorMessage(result),
            isSuccess: false,
          });
        }
        this.initTable();
      });
  }

  openDialog(name: string, type: DeletionType): void {
    const dialogRef = this.dialog.open(DialogDeleteComponent, {
      width: '800px',
      data: { data: ' 	die Studie ' + name },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.openDialogDeletePartner(name, type);
      }
    });
  }

  openDialogDeletePartner(
    studyName: string,
    type: DeletionType,
    usernameSysAdmin?: string,
    pendingdeletionId?: number
  ): void {
    const dialogData: DialogDeletePartnerData = {
      usernames: {
        studyName,
        usernameSysAdmin: usernameSysAdmin ? usernameSysAdmin : null,
      },
      type,
      pendingdeletionId,
    };
    const dialogRef: MatDialogRef<
      DialogDeletePartnerComponent,
      DialogDeletePartnerResult
    > = this.dialog.open<
      DialogDeletePartnerComponent,
      DialogDeletePartnerData,
      DialogDeletePartnerResult
    >(DialogDeletePartnerComponent, {
      width: '400px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let data: DialogPopUpData;
        if (result.success) {
          this.initTable();
          switch (result.action) {
            case 'confirmed':
              data = {
                content: 'DIALOG.SUCCESS_DELETED_STUDY',
                values: { for_id: result.deletedId },
                isSuccess: true,
              };
              break;
            case 'rejected':
              data = {
                content: 'DIALOG.DELECTION_REJECTED_STUDY',
                values: { for_id: result.deletedId },
                isSuccess: true,
              };
              break;
            case 'requested':
              data = {
                content: 'DIALOG.SUCCESS_REQUESTED_STUDY',
                values: {
                  for_id: result.deletedId,
                  requested_for: result.requestedFor,
                },
                isSuccess: true,
              };
              break;
          }
        } else {
          switch (result.action) {
            case 'confirmed':
              data = {
                content: 'DIALOG.ERROR_DELETE_CONFIRMATION',
                isSuccess: false,
              };
              break;
            case 'rejected':
              data = {
                content: 'DIALOG.ERROR_DELETE_REJECT',
                isSuccess: false,
              };
              break;
            case 'requested':
              data = {
                content: 'DIALOG.ERROR_DELETE_REQUEST',
                isSuccess: false,
              };
              break;
          }
        }
        this.showResultDialog(data);
      }
      this.router.navigate(['/studies']);
    });
  }

  public cancelPendingStudyChange(pendingStudyChangeId: number): void {
    this.dialog
      .open(DialogYesNoComponent, {
        data: { content: 'STUDIES.CANCEL_STUDY_CHANGES_CONFIRMATION_QUESTION' },
      })
      .afterClosed()
      .pipe(filter((result) => result === 'yes'))
      .subscribe(async () => {
        try {
          await this.authService.deletePendingStudyChange(pendingStudyChangeId);
          this.initTable();
          this.showResultDialog({
            content: 'STUDIES.CHANGE_COMPLIANCES_REJECTED',
            isSuccess: true,
          });
        } catch (err) {
          this.showResultDialog({
            content: this.getErrorMessage(err),
            isSuccess: false,
          });
        }
      });
  }

  showResultDialog(data): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '300px',
      data,
    });
  }

  private getErrorMessage(err: unknown): string {
    if (!isSpecificHttpError(err)) {
      return 'ERROR.ERROR_UNKNOWN';
    }
    switch (err.error.errorCode) {
      case 'MISSING_PERMISSION':
        return 'STUDIES.MISSING_PERMISSION';
      case '4_EYE_OPPOSITION.PENDING_CHANGE_ALREADY_EXISTS':
        return 'STUDIES.PENDING_CHANGE_ALREADY_EXISTS';
      case '4_EYE_OPPOSITION.REQUESTED_FOR_NOT_REACHED':
        return 'STUDIES.REQUESTED_FOR_NOT_REACHED';
      case 'STUDY.INVALID_PSEUDONYM_PREFIX':
        return 'STUDIES.INVALID_PSEUDONYM_PREFIX';
      default:
        return 'ERROR.ERROR_UNKNOWN';
    }
  }
}
