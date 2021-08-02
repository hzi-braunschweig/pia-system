/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  ElementRef,
  ChangeDetectorRef,
  ViewChild,
  OnInit,
} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../../_services/alert.service';
import { StudiesDataSource } from '../../../_helpers/studies-data-source';
import { StudiesDatabase } from '../../../_helpers/studies-database';
import { Router } from '@angular/router';
import { Studie } from '../../../psa.app.core/models/studie';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../../../psa.app.core/models/user';
import { DialogDeleteComponent } from '../../../_helpers/dialog-delete';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { DialogStudyComponent } from 'src/app/dialogs/study-dialog/study-dialog';
import { ActivatedRoute } from '@angular/router';
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
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { forwardRef } from '@angular/core';
import { DialogChangeStudyComponent } from 'src/app/dialogs/dialog-change-study/dialog-change-study.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  templateUrl: 'studies.component.html',
  styleUrls: ['studies.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: forwardRef(() => MatPaginatorIntlGerman),
    },
  ],
})
export class StudiesComponent implements OnInit {
  @ViewChild('filter', { static: true }) filter: ElementRef;
  @ViewChild(MatPaginator, { static: true }) _paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  studies: Studie[];
  currentRole: string;
  currentUser: User;
  pendingDeletionId: string;
  type: DeletionType;
  pendingStudyChangeId: string;

  displayedColumns = ['name', 'description', 'status', 'access_level', 'view'];
  studiesDatabase: StudiesDatabase;
  dataSource: StudiesDataSource | null;
  selection = new SelectionModel<string>(true, []);
  currentStudy: string;

  constructor(
    private questionnaireService: QuestionnaireService,
    private alertService: AlertService,
    private translate: TranslateService,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.questionnaireService
      .getStudies()
      .then((result: any) => {
        this.studies = result.studies;

        const jwtHelper: JwtHelperService = new JwtHelperService();
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const tokenPayload = jwtHelper.decodeToken(this.currentUser.token);
        this.currentRole = tokenPayload.role;

        this.pendingDeletionId =
          this.activatedRoute.snapshot.queryParamMap.get('pendingDeletionId');
        this.pendingStudyChangeId =
          this.activatedRoute.snapshot.queryParamMap.get(
            'pendingStudyChangeId'
          );
        this.type = this.activatedRoute.snapshot.queryParamMap.get(
          'type'
        ) as DeletionType;

        if (this.pendingDeletionId && this.type === 'study') {
          this.authService
            .getPendingDeletion(this.pendingDeletionId)
            .then((pendingDeletion: any) => {
              if (pendingDeletion.requested_for && pendingDeletion.for_id) {
                this.openDialogDeletePartner(
                  pendingDeletion.for_id,
                  this.type,
                  pendingDeletion.requested_by,
                  pendingDeletion.id
                );
              }
            })
            .catch((err: HttpErrorResponse) => {
              if (
                err.error.message ===
                'The requester is not allowed to get this pending deletion'
              ) {
                this.showResultDialog({
                  content: 'PROBANDEN.PENDING_DELETE_ERROR',
                  isSuccess: false,
                });
              } else if (
                err.error.message === 'The pending deletion was not found'
              ) {
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
            });
        }

        if (this.pendingStudyChangeId) {
          const correspondingStudy = this.studies.find(
            (study) =>
              study.pendingStudyChange &&
              study.pendingStudyChange.id === this.pendingStudyChangeId
          );

          if (
            correspondingStudy &&
            correspondingStudy.pendingStudyChange &&
            correspondingStudy.pendingStudyChange.requested_for ===
              this.currentUser.username
          ) {
            this.openDialogChangeStudy(correspondingStudy);
          }
        }
      })
      .catch((err: any) => {
        this.alertService.errorObject(err);
      });
  }

  ngOnInit(): void {
    this.initTable();
    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
  }

  initTable(): void {
    this.studiesDatabase = new StudiesDatabase(
      this.questionnaireService,
      this.translate,
      this.alertService,
      this.currentRole === 'Untersuchungsteam'
    );
    this.dataSource = new StudiesDataSource(
      this.studiesDatabase,
      this._paginator,
      this.sort,
      this.translate
    );
    this.cdr.detectChanges();
  }

  filterSelectMethod(): void {
    if (!this.dataSource) {
      return;
    }
    this.dataSource.filter = this.currentStudy;
  }

  viewAllUsersInStudy(name: string): void {
    this.router.navigate(['/studies', name, 'users']);
  }

  addOrEditStudy(studyName: string): void {
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

  openDialogChangeStudy(study: Studie): void {
    const dialogRef = this.dialog.open(DialogChangeStudyComponent, {
      width: study.pendingStudyChange ? '1100px' : '700px',
      height: 'auto',
      data: { study },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result === 'rejected') {
        const data = {
          content: 'STUDIES.CHANGE_COMPLIANCES_REJECTED',
          isSuccess: false,
        };
        this.showResultDialog(data);
      } else if (result && result === 'accepted') {
        const data = {
          content: 'STUDIES.CHANGE_COMPLIANCES_ACCEPTED',
          isSuccess: true,
        };
        this.showResultDialog(data);
      } else if (result && result === 'requested') {
        const data = {
          content: 'STUDIES.CHANGE_COMPLIANCES_REQUESTED',
          isSuccess: true,
        };
        this.showResultDialog(data);
      } else if (result) {
        if (result.error) {
          this.showResultDialog({
            content: result.error.message,
            isSuccess: false,
          });
        } else {
          this.showResultDialog(result);
        }
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
    pendingdeletionId?: string
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
          this.showResultDialog(data);
        }
      }
      this.router.navigate(['/studies']);
    });
  }

  showResultDialog(data): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '300px',
      data,
    });
  }
}
