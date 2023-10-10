/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialog as MatDialog,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { SampleTrackingService } from 'src/app/psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { CurrentUser } from '../../../_services/current-user.service';

@Component({
  selector: 'app-request-new-material',
  templateUrl: './request-new-material.component.html',
  styleUrls: ['./request-new-material.component.scss'],
})
export class RequestNewMaterialComponent {
  constructor(
    public readonly dialog: MatDialog,
    private readonly sampleTrackingService: SampleTrackingService,
    private readonly user: CurrentUser
  ) {}

  onRequestMaterial(): void {
    this.openConfirmMaterialRequestDialog();
  }

  openConfirmMaterialRequestDialog(): void {
    const dialogRef = this.dialog.open(ConfirmNewMaterialRequestComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.shouldRequestNewMaterial) {
        this.sampleTrackingService
          .requestMaterialForProband(this.user.username)
          .then((res) => {
            this.showRequestWasSuccessDialog();
          })
          .catch((err) => {
            console.log(err);
            this.showRequestFailedDialog();
          });
      }
    });
  }

  private showRequestWasSuccessDialog(): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '500px',
      data: {
        data: '',
        content: 'SAMPLE_MANAGEMENT.MATERIAL_REQUESTED',
        isSuccess: true,
      },
    });
  }

  private showRequestFailedDialog(): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '500px',
      data: {
        data: '',
        content: 'SAMPLE_MANAGEMENT.ERROR_MATERIAL_REQUEST',
        isSuccess: false,
      },
    });
  }
}

@Component({
  selector: 'confirm-new-material-request',
  template: `
    <h1 mat-dialog-title style=" display: flex; justify-content: center; ">
      {{ 'SAMPLE_MANAGEMENT.SURE_REQUEST_MATERIAL' | translate }}
    </h1>
    <div>
      <button
        mat-raised-button
        style="margin:10px;"
        color="primary"
        (click)="confirmSelection()"
      >
        Ja
      </button>
      <button
        mat-raised-button
        style="margin:10px;"
        color="primary"
        (click)="onNoClick()"
      >
        Nein
      </button>
    </div>
  `,
})
export class ConfirmNewMaterialRequestComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmNewMaterialRequestComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close({ shouldRequestNewMaterial: false });
  }

  confirmSelection(): void {
    this.dialogRef.close({ shouldRequestNewMaterial: true });
  }
}
