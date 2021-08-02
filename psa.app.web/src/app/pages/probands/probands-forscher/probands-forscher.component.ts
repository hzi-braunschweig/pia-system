/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../../_services/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogExportDataComponent } from '../../../dialogs/export-dialog/export-dialog.component';
import {
  DialogSelectForPartialDeletionComponent,
  DialogSelectForPartialDeletionData,
  DialogSelectForPartialDeletionResult,
} from '../../../dialogs/dialog-partial-deletion/select/dialog-select-for-partial-deletion.component';
import {
  DialogPopUpComponent,
  DialogPopUpData,
} from '../../../_helpers/dialog-pop-up';
import {
  DialogCreatePartialDeletionComponent,
  DialogCreatePartialDeletionData,
  DialogCreatePartialDeletionResult,
} from '../../../dialogs/dialog-partial-deletion/create/dialog-create-partial-deletion.component';
import {
  DialogConfirmPartialDeletionComponent,
  DialogConfirmPartialDeletionData,
  DialogConfirmPartialDeletionResult,
} from '../../../dialogs/dialog-partial-deletion/confirm/dialog-confirm-partial-deletion.component';
import { ProbandsListComponent } from '../../../features/probands-list/probands-list.component';

@Component({
  selector: 'app-probands-forscher',
  templateUrl: 'probands-forscher.component.html',
  styleUrls: ['probands-forscher.component.scss'],
})
export class ProbandsForscherComponent {
  @ViewChild(ProbandsListComponent, { static: true })
  probandsListComponent: ProbandsListComponent;

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {
    const pendingPartialDeletionId =
      this.activatedRoute.snapshot.queryParamMap.get(
        'pendingPartialDeletionId'
      );
    if (pendingPartialDeletionId) {
      this.openDialogToConfirmPartialDeletion(
        Number.parseInt(pendingPartialDeletionId, 10)
      );
    }
  }

  openDialogExportData(): void {
    this.dialog.open(DialogExportDataComponent, {
      width: '800px',
    });
  }

  viewQuestionnaireInstancesForUser(username: string): void {
    this.router.navigate(['/questionnaireInstances/', username]);
  }

  viewLabResultsForUser(username: string): void {
    this.router.navigate(['/laboratory-results/', { user_id: username }]);
  }

  viewSamplesForUser(username: string): void {
    this.router.navigate(['/sample-management/', username]);
  }

  openSelectDataForPartialDeletionDialog(probandId: string): void {
    const dialogRef = this.dialog.open<
      DialogSelectForPartialDeletionComponent,
      DialogSelectForPartialDeletionData,
      DialogSelectForPartialDeletionResult
    >(DialogSelectForPartialDeletionComponent, {
      width: '800px',
      data: this.probandsListComponent.activeFilter
        ? {
            probandId,
            studyId: this.probandsListComponent.activeFilter
              ? this.probandsListComponent.activeFilter.studyName
              : '',
          }
        : { probandId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.openDialogToCreatePartialDeletion(result);
      }
    });
  }

  private openDialogToCreatePartialDeletion(
    dataForDelete: DialogSelectForPartialDeletionResult
  ): void {
    const dialogRef = this.dialog.open<
      DialogCreatePartialDeletionComponent,
      DialogCreatePartialDeletionData,
      DialogCreatePartialDeletionResult
    >(DialogCreatePartialDeletionComponent, {
      width: '800px',
      data: {
        dataForDelete,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.successfullyCreated) {
          this.showSuccessOrFailDialog({
            content: 'DIALOG.PARTIAL_DELETION.SUCCESSFULLY_REQUESTED',
            values: {
              probandUsername: result.probandId,
              requestedFor: result.requestedFor,
            },
            isSuccess: true,
          });
        } else {
          this.showSuccessOrFailDialog({
            content: 'DIALOG.ERROR_DELETE_REQUEST',
            isSuccess: false,
          });
        }
      }
    });
  }

  private showSuccessOrFailDialog(data: DialogPopUpData): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '300px',
      data,
    });
  }

  private async openDialogToConfirmPartialDeletion(
    pendingPartialDeletionId: number
  ): Promise<void> {
    try {
      const pendingPartialDeletion =
        await this.authService.getPendingPartialDeletion(
          pendingPartialDeletionId
        );
      const dialogRef = this.dialog.open<
        DialogConfirmPartialDeletionComponent,
        DialogConfirmPartialDeletionData,
        DialogConfirmPartialDeletionResult
      >(DialogConfirmPartialDeletionComponent, {
        width: '800px',
        data: {
          partialDeletionResponse: pendingPartialDeletion,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          if (result.successfullyConfirmed) {
            this.showSuccessOrFailDialog({
              content: 'DIALOG.PARTIAL_DELETION.SUCCESSFULLY_DELETED',
              values: { probandUsername: result.probandId },
              isSuccess: true,
            });
          } else if (result.successfullyRejected) {
            this.showSuccessOrFailDialog({
              content: 'DIALOG.PARTIAL_DELETION.SUCCESSFULLY_REJECTED',
              values: { probandUsername: result.probandId },
              isSuccess: true,
            });
          } else {
            this.showSuccessOrFailDialog({
              content: 'DIALOG.ERROR_DELETE_CONFIRMATION',
              isSuccess: false,
            });
          }
        }
      });
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }
}
