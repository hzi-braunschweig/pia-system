/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../../_services/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Study } from '../../../psa.app.core/models/study';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PersonalDataService } from 'src/app/psa.app.core/providers/personaldata-service/personaldata-service';
import { DialogDeleteComponent } from '../../../_helpers/dialog-delete';
import {
  DeletionType,
  DialogDeletePartnerComponent,
  DialogDeletePartnerData,
  DialogDeletePartnerResult,
} from '../../../_helpers/dialog-delete-partner';
import {
  DialogPopUpComponent,
  DialogPopUpData,
} from '../../../_helpers/dialog-pop-up';
import { DialogChangeComplianceComponent } from '../../../_helpers/dialog-change-compliance';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { HttpErrorResponse } from '@angular/common/http';
import { ProbandService } from '../../../psa.app.core/providers/proband-service/proband.service';
import { Proband } from '../../../psa.app.core/models/proband';
import { PendingComplianceChange } from '../../../psa.app.core/models/pendingComplianceChange';
import { PersonalData } from '../../../psa.app.core/models/personalData';
import { PendingPersonalDataDeletion } from '../../../psa.app.core/models/pendingPersonalDataDeletion';
import { PendingProbandDeletion } from '../../../psa.app.core/models/pendingDeletion';
import { AccountStatusPipe } from '../../../pipes/account-status.pipe';
import { CurrentUser } from '../../../_services/current-user.service';
import { DialogYesNoComponent } from '../../../_helpers/dialog-yes-no';
import { filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';

export interface DialogChangeComplianceData {
  has_four_eyes_opposition: boolean;
  usernameProband: string;
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
  requested_by: string;
  requested_for: string;
  deletePendingComplianceChangeId: number;
  studyName?: string;
}

interface TableRow {
  pseudonym: string;
  ids: string;
  firstname: string;
  lastname: string;
  accountStatus: string;
  proband: Proband;
  personalData?: PersonalData;
  pendingComplianceChange?: PendingComplianceChange;
  pendingPersonalDataDeletion?: PendingPersonalDataDeletion;
  pendingProbandDeletion?: PendingProbandDeletion;
}

@Component({
  templateUrl: 'probands-personal-info.component.html',
  styleUrls: ['probands-personal-info.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
})
export class ProbandsPersonalInfoComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) private sort: MatSort;

  public studies: Study[];
  public currentStudy: Study | undefined;
  public readonly dataSource: MatTableDataSource<TableRow> =
    new MatTableDataSource();
  public displayedColumns = [
    'pseudonym',
    'ids',
    'firstname',
    'lastname',
    'edit',
    'accountStatus',
    'view_answers',
    'delete',
  ];
  public filterKeyword: string = '';
  public isLoading: boolean = true;
  public currentUsername: string = this.user.username;

  public constructor(
    public user: CurrentUser,
    private userService: UserService,
    private authService: AuthService,
    private personalDataService: PersonalDataService,
    private probandService: ProbandService,
    private alertService: AlertService,
    private router: Router,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private accountStatusPipe: AccountStatusPipe,
    private translate: TranslateService,
    private datePipe: DatePipe
  ) {
    const probandIdToDelete =
      this.activatedRoute.snapshot.queryParamMap.get('probandIdToDelete');
    const type = this.activatedRoute.snapshot.queryParamMap.get(
      'type'
    ) as DeletionType;
    const pendingComplianceChangeId =
      this.activatedRoute.snapshot.queryParamMap.get(
        'pendingComplianceChangeId'
      );

    if (probandIdToDelete) {
      switch (type) {
        case 'personal':
          this.personalDataService
            .getPendingDeletionForProbandId(probandIdToDelete)
            .then(async (result) => {
              if (result.requested_for && result.proband_id) {
                this.openDialogDeletePartner({
                  usernames: {
                    usernameProband: result.proband_id,
                    usernamePM: result.requested_by,
                  },
                  type,
                  pendingdeletionId: result.id,
                  affectedStudy: result.study,
                });
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
          break;
        case 'general':
          this.authService
            .getPendingDeletionForProbandId(probandIdToDelete)
            .then(async (result) => {
              if (result.requested_for && result.for_id && result.type) {
                const { study } = await this.authService.getProband(
                  result.for_id
                );
                this.openDialogDeletePartner({
                  usernames: {
                    usernameProband: result.for_id,
                    usernamePM: result.requested_by,
                  },
                  type,
                  pendingdeletionId: result.id,
                  affectedStudy: study,
                });
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
          break;
      }
    }
    if (pendingComplianceChangeId) {
      this.authService
        .getPendingComplianceChange(pendingComplianceChangeId)
        .then((pendingComplianceChange) => {
          if (
            pendingComplianceChange.requested_for &&
            pendingComplianceChange.proband_id
          ) {
            void this.openPendingComplianceChangeDialog(
              pendingComplianceChange
            );
          }
        })
        .catch((err: HttpErrorResponse) => {
          if (
            err.error.message ===
            'The requester is not allowed to get this pending compliance change'
          ) {
            this.showResultDialog({
              content: 'PROBANDEN.PENDING_COMPLIANCE_ERROR',
              isSuccess: false,
            });
          } else if (
            err.error.message === 'The pending compliance change was not found'
          ) {
            this.showResultDialog({
              content: 'PROBANDEN.PENDING_COMPLIANCE_NOT_FOUND',
              isSuccess: false,
            });
          } else if (
            err.error.message ===
            'Could not get the pending compliance change: Unknown or wrong role'
          ) {
            this.showResultDialog({
              content: 'PROBANDEN.PENDING_COMPLIANCE_WRONG_ROLE',
              isSuccess: false,
            });
          } else {
            this.alertService.errorObject(err);
          }
        });
    }
  }

  public async ngOnInit(): Promise<void> {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.isLoading = true;
    this.studies = await this.userService.getStudies();
    if (this.studies.length === 1) {
      this.currentStudy = this.studies[0];
    }
    await this.initTable();
    this.isLoading = false;
  }

  public async initTable(): Promise<void> {
    if (!this.currentStudy) {
      this.dataSource.data = [];
      return;
    }
    this.isLoading = true;
    const tableData: TableRow[] = [];
    try {
      // Load all the data
      const [
        probands,
        allPersonalData,
        pendingComplianceChanges,
        pendingPersonalDataDeletions,
        pendingProbandDeletions,
      ] = await Promise.all([
        this.probandService.getProbands(this.currentStudy.name),
        this.personalDataService.getPersonalDataAll(),
        this.probandService.getPendingComplianceChanges(this.currentStudy.name),
        this.personalDataService.getPendingPersonalDataDeletions(
          this.currentStudy.name
        ),
        this.probandService.getPendingProbandDeletions(this.currentStudy.name),
      ]);
      const allPersonalDataMap = allPersonalData.reduce(
        (map, item) => map.set(item.pseudonym, item),
        new Map<string, PersonalData>()
      );
      const pendingComplianceChangesMap = pendingComplianceChanges.reduce(
        (map, item) => map.set(item.proband_id, item),
        new Map<string, PendingComplianceChange>()
      );
      const pendingPersonalDataDeletionsMap =
        pendingPersonalDataDeletions.reduce(
          (map, item) => map.set(item.proband_id, item),
          new Map<string, PendingPersonalDataDeletion>()
        );
      const pendingProbandDeletionsMap = pendingProbandDeletions.reduce(
        (map, item) => map.set(item.for_id, item),
        new Map<string, PendingProbandDeletion>()
      );

      for (const proband of probands) {
        const personalData = allPersonalDataMap.get(proband.pseudonym);

        tableData.push({
          pseudonym:
            proband.pseudonym === proband.ids?.toLowerCase()
              ? ''
              : proband.pseudonym,
          ids: proband.ids,
          firstname: personalData?.vorname ?? '',
          lastname: personalData?.name ?? '',
          accountStatus: this.accountStatusPipe.transform(proband),
          proband,
          personalData,
          pendingComplianceChange: pendingComplianceChangesMap.get(
            proband.pseudonym
          ),
          pendingPersonalDataDeletion: pendingPersonalDataDeletionsMap.get(
            proband.pseudonym
          ),
          pendingProbandDeletion: pendingProbandDeletionsMap.get(
            proband.pseudonym
          ),
        });
      }
    } catch (e) {
      this.alertService.errorObject(e);
    }

    this.dataSource.data = tableData;
    this.isLoading = false;
  }

  public applyFilter(): void {
    this.dataSource.filter = this.filterKeyword.trim().toLowerCase();
  }

  public resetFilter(): void {
    this.filterKeyword = '';
    this.applyFilter();
  }

  public editPersonalData(username: string): void {
    void this.router.navigate(['/probands-personal-info/', username]);
  }

  public openDialog(proband: Proband, type: DeletionType): void {
    const username = proband.pseudonym ? proband.pseudonym : proband.ids;
    const data =
      type === 'personal'
        ? { data: 'die Kontaktdaten vom Probanden ' + username }
        : {
            data: 'alle Forschungs- und Kontaktdaten vom Probanden ' + username,
          };
    const dialogRef = this.dialog.open(DialogDeleteComponent, {
      width: '500px',
      data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        if (this.currentStudy.has_four_eyes_opposition) {
          this.openDialogDeletePartner({
            usernames: {
              usernameProband: username,
            },
            type,
            affectedStudy: proband.study,
          });
        } else {
          void this.doDeletion(type, username);
        }
      }
    });
  }

  public getTranslatedAccountStatusTooltipText(proband: Proband): string {
    const dateFormat = 'dd.MM.yyyy';
    if (proband.deactivatedAt) {
      return this.translate.instant('PROBANDEN.ACCOUNT_STATUS_DEACTIVATED_AT', {
        deactivatedAt: this.datePipe.transform(
          proband.deactivatedAt,
          dateFormat
        ),
      });
    } else if (proband.deletedAt) {
      return this.translate.instant('PROBANDEN.ACCOUNT_STATUS_DELETED_AT', {
        deletedAt: this.datePipe.transform(proband.deletedAt, dateFormat),
      });
    }
    return null;
  }

  private async doDeletion(
    type: DeletionType,
    username: string
  ): Promise<void> {
    this.isLoading = true;

    let data: DialogPopUpData;
    try {
      switch (type) {
        case 'personal':
          await this.personalDataService.postPendingDeletion({
            requested_for: this.user.username,
            proband_id: username,
          });
          data = {
            content: 'DIALOG.SUCCESS_DELETED_PROBAND',
            values: { for_id: username },
            isSuccess: true,
          };
          break;
        case 'general':
          await this.authService.postPendingDeletion({
            requested_for: this.user.username,
            type: 'proband',
            for_id: username,
          });
          data = {
            content: 'DIALOG.SUCCESS_DELETED_PROBAND',
            values: { for_id: username },
            isSuccess: true,
          };
          break;
      }
      await this.initTable();
    } catch (err) {
      data = {
        content: 'DIALOG.ERROR_DELETE',
        isSuccess: false,
      };
    }
    this.showResultDialog(data);
    this.isLoading = false;
  }

  public async openPendingComplianceChangeDialog(
    pendingComplianceChange: PendingComplianceChange
  ): Promise<void> {
    await this.openDialogChangeCompliance({
      has_four_eyes_opposition: true,
      usernameProband: pendingComplianceChange.proband_id,
      compliance_labresults: pendingComplianceChange.compliance_labresults_to,
      compliance_samples: pendingComplianceChange.compliance_samples_to,
      compliance_bloodsamples:
        pendingComplianceChange.compliance_bloodsamples_to,
      requested_by: pendingComplianceChange.requested_by,
      requested_for: this.user.username,
      deletePendingComplianceChangeId: pendingComplianceChange.id,
    });
  }

  public async openComplianceChangeDialog(proband: Proband): Promise<void> {
    await this.openDialogChangeCompliance({
      has_four_eyes_opposition: this.currentStudy.has_four_eyes_opposition,
      usernameProband: proband.pseudonym,
      compliance_labresults: proband.complianceLabresults,
      compliance_samples: proband.complianceSamples,
      compliance_bloodsamples: proband.complianceBloodsamples,
      requested_by: null,
      requested_for: this.user.username,
      deletePendingComplianceChangeId: null,
      studyName: this.currentStudy.name,
    });
  }

  public confirmProbandDeletion(
    pendingProbandDeletion: PendingProbandDeletion,
    studyName: string
  ): void {
    this.openDialogDeletePartner({
      usernames: {
        usernameProband: pendingProbandDeletion.for_id,
        usernamePM: pendingProbandDeletion.requested_by,
      },
      type: 'general',
      pendingdeletionId: pendingProbandDeletion.id,
      affectedStudy: studyName,
    });
  }

  public confirmCommunicationBan(
    pendingPersonalDataDeletion: PendingPersonalDataDeletion,
    studyName: string
  ): void {
    this.openDialogDeletePartner({
      usernames: {
        usernameProband: pendingPersonalDataDeletion.proband_id,
        usernamePM: pendingPersonalDataDeletion.requested_by,
      },
      type: 'personal',
      pendingdeletionId: pendingPersonalDataDeletion.id,
      affectedStudy: studyName,
    });
  }

  private openDialogDeletePartner(dialogData: DialogDeletePartnerData): void {
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
          void this.initTable();
          switch (result.action) {
            case 'confirmed':
              data = {
                content: 'DIALOG.SUCCESS_DELETED_PROBAND',
                values: { for_id: result.deletedId },
                isSuccess: true,
              };
              break;
            case 'rejected':
              data = {
                content: 'DIALOG.DELETION_REJECTED_PROBAND',
                values: { for_id: result.deletedId },
                isSuccess: true,
              };
              break;
            case 'requested':
              data = {
                content: 'DIALOG.SUCCESS_REQUESTED_PROBAND',
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
    });
  }

  private async openDialogChangeCompliance(
    data: DialogChangeComplianceData
  ): Promise<void> {
    this.dialog
      .open(DialogChangeComplianceComponent, {
        width: '400px',
        data,
      })
      .afterClosed()
      .subscribe(async (result) => {
        if (result) {
          if (result[1] && result[1].proband_id) {
            await this.initTable();
            result[1].for_id = result[1].for_id
              ? result[1].for_id
              : result[1].proband_id;
            let response;
            if (result[0].acceptDelete || !data.has_four_eyes_opposition) {
              response = result[0].changingRejected
                ? {
                    content: 'PROBANDEN.CHANGE_COMPLIANCES_REJECTED',
                    values: { probandUsername: result[1].proband_id },
                    isSuccess: false,
                  }
                : {
                    content: 'PROBANDEN.PROBAND_COMPLIANCES_CHANGED',
                    values: { probandUsername: result[1].proband_id },
                    isSuccess: true,
                  };
            } else {
              response = {
                content: 'PROBANDEN.CHANGE_COMPLIANCES_REQUESTED',
                isSuccess: true,
              };
            }
            this.showResultDialog(response);
          } else {
            let dataError;
            if (result[0] && result[0].acceptDelete) {
              dataError = {
                content: 'DIALOG.ERROR_COMPLIANCE_CONFIRMATION',
                isSuccess: false,
              };
            } else if (result[0] && !result[0].acceptDelete) {
              dataError = {
                content: 'DIALOG.ERROR_COMPLIANCE_REQUEST',
                isSuccess: false,
              };
            } else {
              dataError = {
                content: 'DIALOG.ERROR_COMPLIANCE',
                isSuccess: false,
              };
            }
            this.showResultDialog(dataError);
          }
        }
      });
  }

  public cancelTotalOpposition(
    pendingdeletionId: number,
    deletedId: string
  ): void {
    this.dialog
      .open(DialogYesNoComponent, {
        data: {
          content: 'PROBANDEN.CANCEL_TOTAL_OPPOSITION_CONFIRMATION_QUESTION',
        },
      })
      .afterClosed()
      .pipe(filter((result) => result === 'yes'))
      .subscribe(async () => {
        try {
          await this.authService.deletePendingDeletion(pendingdeletionId);
          void this.initTable();
          this.showResultDialog({
            content: 'DIALOG.DELETION_REJECTED_PROBAND',
            values: { for_id: deletedId },
            isSuccess: true,
          });
        } catch (err) {
          this.showResultDialog({
            content: 'DIALOG.ERROR_DELETE_REJECT',
            isSuccess: false,
          });
        }
      });
  }

  public cancelCommunicationBan(pseudonym: string): void {
    this.dialog
      .open(DialogYesNoComponent, {
        data: {
          content: 'PROBANDEN.CANCEL_COMMUNICATION_BAN_CONFIRMATION_QUESTION',
        },
      })
      .afterClosed()
      .pipe(filter((result) => result === 'yes'))
      .subscribe(async () => {
        try {
          await this.personalDataService.deletePendingDeletion(pseudonym);
          void this.initTable();
          this.showResultDialog({
            content: 'DIALOG.DELETION_REJECTED_PROBAND',
            values: { for_id: pseudonym },
            isSuccess: true,
          });
        } catch (err) {
          this.showResultDialog({
            content: 'DIALOG.ERROR_DELETE_REJECT',
            isSuccess: false,
          });
        }
      });
  }

  public cancelPendingComplianceChange(
    pendingComplianceChangeId: number,
    pseudonym: string
  ): void {
    this.dialog
      .open(DialogYesNoComponent, {
        data: {
          content: 'PROBANDEN.CANCEL_COMPLIANCE_CHANGE_CONFIRMATION_QUESTION',
        },
      })
      .afterClosed()
      .pipe(filter((result) => result === 'yes'))
      .subscribe(async () => {
        try {
          await this.authService.deletePendingComplianceChange(
            pendingComplianceChangeId
          );
          void this.initTable();
          this.showResultDialog({
            content: 'PROBANDEN.CHANGE_COMPLIANCES_REJECTED',
            values: { probandUsername: pseudonym },
            isSuccess: true,
          });
        } catch (err) {
          this.showResultDialog({
            content: 'DIALOG.ERROR_COMPLIANCE_REQUEST',
            isSuccess: false,
          });
        }
      });
  }

  public viewQuestionnaireInstancesForUser(pseudonym: string): void {
    void this.router.navigate(['/questionnaireInstances/', pseudonym]);
  }

  private showResultDialog(data): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '300px',
      data,
    });
  }
}
