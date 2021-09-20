/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../../_services/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Studie } from '../../../psa.app.core/models/studie';
import { User } from '../../../psa.app.core/models/user';
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
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { ProbandService } from '../../../psa.app.core/providers/proband-service/proband.service';
import { Proband } from '../../../psa.app.core/models/proband';
import { PendingComplianceChange } from '../../../psa.app.core/models/pendingComplianceChange';

interface TableRow {
  username: string;
  ids: string;
  vorname: string;
  nachname: string;
  accountStatus: string;
  pendingComplianceChange: boolean;
  pendingComplianceChangeObject: PendingComplianceChange;
  pendingDeletionPersonalObject: any;
  pendingDeletionGeneralObject: any;
}

@Component({
  templateUrl: 'probands-personal-info.component.html',
  styleUrls: ['probands-personal-info.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: forwardRef(() => MatPaginatorIntlGerman),
    },
  ],
})
export class ProbandsPersonalInfoComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) private sort: MatSort;

  public studies: Studie[];
  private probands: Proband[];
  public currentUser: User = this.auth.currentUser;
  public currentStudy: Studie | undefined;
  public readonly dataSource: MatTableDataSource<TableRow> =
    new MatTableDataSource();
  public displayedColumns = [
    'username',
    'ids',
    'vorname',
    'nachname',
    'view',
    'accountStatus',
    'view_answers',
    'delete',
  ];
  public filterKeyword: string = '';
  public isLoading: boolean = true;

  constructor(
    private questionnaireService: QuestionnaireService,
    private authService: AuthService,
    private personalDataService: PersonalDataService,
    private probandService: ProbandService,
    private auth: AuthenticationManager,
    private alertService: AlertService,
    private router: Router,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute
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
            .then((result) => {
              if (result.requested_for && result.proband_id) {
                this.openDialogDeletePartner(
                  result.proband_id,
                  type,
                  result.requested_by,
                  result.id
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
          break;
        case 'general':
          this.authService
            .getPendingDeletionForProbandId(probandIdToDelete)
            .then((result) => {
              if (result.requested_for && result.for_id && result.type) {
                this.openDialogDeletePartner(
                  result.for_id,
                  type,
                  result.requested_by,
                  result.id
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
          break;
      }
    }
    if (pendingComplianceChangeId) {
      this.authService
        .getPendingComplianceChange(pendingComplianceChangeId)
        .then((result) => {
          if (result.requested_for && result.proband_id) {
            void this.openPendingComplianceChangeDialog(
              result.proband_id,
              result
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

  private static getAccountStatusTranslationString(proband: Proband): string {
    if (
      proband.accountStatus === 'active' &&
      proband.studyStatus === 'active'
    ) {
      return 'PROBANDEN.STATUS_ACTIV';
    } else if (proband.studyStatus === 'deletion_pending') {
      return 'PROBANDEN.STATUS_DELETION_PENDING';
    } else if (proband.studyStatus === 'deleted') {
      return 'PROBANDEN.STATUS_DELETED';
    } else if (proband.accountStatus === 'deactivation_pending') {
      return 'PROBANDEN.STATUS_DEACTIVATION_PENDING';
    } else if (proband.accountStatus === 'deactivated') {
      return 'PROBANDEN.STATUS_DEACTIVATED';
    } else if (proband.accountStatus === 'no_account') {
      return 'PROBANDEN.STATUS_NO_ACCOUNT';
    }
    return null;
  }

  public async ngOnInit(): Promise<void> {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.isLoading = true;
    this.studies = (await this.questionnaireService.getStudies()).studies;
    if (this.studies.length === 1) {
      this.currentStudy = this.studies[0];
      await this.initTable();
    }
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
      const probandenPersonalData =
        await this.personalDataService.getPersonalDataAll();
      this.probands = await this.probandService.getProbandsByStudy(
        this.currentStudy.name
      );

      for (const proband of this.probands) {
        const personalDataForPseudonym = probandenPersonalData.find(
          (personalData) => personalData.pseudonym === proband.username
        );

        const pendingDeletionObject =
          await this.getPendingDeletionObjectForProband(proband);

        tableData.push({
          username: proband.username === proband.ids ? '' : proband.username,
          ids: proband.ids,
          vorname: personalDataForPseudonym
            ? personalDataForPseudonym.vorname
            : '',
          nachname: personalDataForPseudonym
            ? personalDataForPseudonym.name
            : '',
          accountStatus:
            ProbandsPersonalInfoComponent.getAccountStatusTranslationString(
              proband
            ),
          pendingComplianceChange: !!proband.pendingComplianceChange,
          pendingComplianceChangeObject:
            await this.getPendingComplianceChangeObjectForProband(proband),
          pendingDeletionPersonalObject:
            proband.accountStatus === 'deactivation_pending'
              ? pendingDeletionObject
              : null,
          pendingDeletionGeneralObject:
            proband.studyStatus === 'deletion_pending'
              ? pendingDeletionObject
              : null,
        });
      }
    } catch (e) {
      console.log(e);
    }

    this.dataSource.data = tableData;
    this.isLoading = false;
  }

  private async getPendingComplianceChangeObjectForProband(
    proband: Proband
  ): Promise<PendingComplianceChange> {
    try {
      const pendingComplianceChangeObject: PendingComplianceChange =
        proband.pendingComplianceChange
          ? await this.authService.getPendingComplianceChangeForProband(
              proband.username
            )
          : null;
      if (
        pendingComplianceChangeObject &&
        pendingComplianceChangeObject.requested_for ===
          this.currentUser.username
      ) {
        return pendingComplianceChangeObject;
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  private async getPendingDeletionObjectForProband(
    proband: Proband
  ): Promise<any> {
    try {
      const pendingDeletionObject: any =
        proband.studyStatus === 'deletion_pending'
          ? await this.authService.getPendingDeletionForProbandId(
              proband.username
            )
          : proband.accountStatus === 'deactivation_pending'
          ? await this.personalDataService.getPendingDeletionForProbandId(
              proband.username
            )
          : null;
      if (
        pendingDeletionObject &&
        pendingDeletionObject.requested_for === this.currentUser.username
      ) {
        return pendingDeletionObject;
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
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

  public openDialog(probandRow: TableRow, type: DeletionType): void {
    const username = probandRow.username ? probandRow.username : probandRow.ids;
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
          this.openDialogDeletePartner(username, type);
        } else {
          void this.doDeletion(type, username);
        }
      }
    });
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
            requested_for: this.currentUser.username,
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
            requested_for: this.currentUser.username,
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

  public openDialogDeletePartner(
    usernameProband: string,
    type: DeletionType,
    usernamePM?: string,
    pendingdeletionId?: string
  ): void {
    const dialogData: DialogDeletePartnerData = {
      usernames: {
        usernameProband,
        usernamePM: usernamePM ? usernamePM : null,
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
                content: 'DIALOG.DELECTION_REJECTED_PROBAND',
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

  public async openPendingComplianceChangeDialog(
    pseudonym: string,
    pendingComplianceChangeObject: PendingComplianceChange
  ): Promise<void> {
    await this.openDialogChangeCompliance({
      has_four_eyes_opposition: true,
      usernameProband: pseudonym,
      compliance_labresults:
        pendingComplianceChangeObject.compliance_labresults_to,
      compliance_samples: pendingComplianceChangeObject.compliance_samples_to,
      compliance_bloodsamples:
        pendingComplianceChangeObject.compliance_bloodsamples_to,
      requested_by: pendingComplianceChangeObject.requested_by,
      requested_for: this.currentUser.username,
      deletePendingComplianceChangeId: pendingComplianceChangeObject.id,
    });
  }

  public async openComplianceChangeDialog(pseudonym: string): Promise<void> {
    const foundProband = this.probands.find(
      (proband) => proband.username === pseudonym
    );

    await this.openDialogChangeCompliance({
      has_four_eyes_opposition: this.currentStudy.has_four_eyes_opposition,
      usernameProband: pseudonym,
      compliance_labresults: foundProband.complianceLabresults,
      compliance_samples: foundProband.complianceSamples,
      compliance_bloodsamples: foundProband.complianceBloodsamples,
      requested_by: null,
      requested_for: this.currentUser.username,
      deletePendingComplianceChangeId: null,
    });
  }

  private async openDialogChangeCompliance(data: {
    has_four_eyes_opposition: boolean;
    usernameProband: string;
    compliance_labresults: boolean;
    compliance_samples: boolean;
    compliance_bloodsamples: boolean;
    requested_by: string;
    requested_for: string;
    deletePendingComplianceChangeId: number;
  }): Promise<void> {
    await this.dialog
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

  public viewQuestionnaireInstancesForUser(username: string): void {
    void this.router.navigate(['/questionnaireInstances/', username]);
  }

  private showResultDialog(data): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '300px',
      data,
    });
  }
}
