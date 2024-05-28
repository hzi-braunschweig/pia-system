/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  DialogPopUpComponent,
  DialogPopUpData,
} from '../../../_helpers/dialog-pop-up';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { PlannedProband } from 'src/app/psa.app.core/models/plannedProband';
import { DataService } from 'src/app/_services/data.service';
import { SelectedProbandInfoService } from '../../../_services/selected-proband-info.service';
import { AlertService } from '../../../_services/alert.service';
import {
  CreateProbandError,
  Proband,
} from '../../../psa.app.core/models/proband';

@Component({
  templateUrl: 'proband.component.html',
  styleUrls: ['proband.component.scss'],
})
export class ProbandComponent implements OnInit, OnDestroy {
  public pseudonym: string;
  public isLoading: boolean;
  public proband: Proband = null;
  public plannedProband: PlannedProband = null;

  public constructor(
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private userService: AuthService,
    private router: Router,
    private selectedProbandInfoService: SelectedProbandInfoService,
    private dataService: DataService,
    private alertService: AlertService
  ) {}

  public async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.pseudonym = this.activatedRoute.snapshot.paramMap.get('pseudonym');
    const created = this.activatedRoute.snapshot.queryParamMap.get('created');

    if (created === 'false') {
      const errorType = this.activatedRoute.snapshot.queryParamMap.get(
        'error'
      ) as CreateProbandError | null;
      this.showFailureDialog(errorType ?? CreateProbandError.UNKNOWN_ERROR);
    } else if (created === 'true') {
      this.showSuccessDialog();
    }

    if (created !== 'false' && this.pseudonym) {
      await this.loadProband();

      this.selectedProbandInfoService.updateSideNavInfoSelectedProband({
        ids: this.proband.ids,
        pseudonym: this.proband.pseudonym,
      });
    }
    this.isLoading = false;
  }

  public ngOnDestroy(): void {
    this.selectedProbandInfoService.updateSideNavInfoSelectedProband(null);
  }

  public async changeTestprobandState(checked: boolean): Promise<void> {
    this.isLoading = true;
    try {
      await this.userService.patchProband(this.pseudonym, {
        is_test_proband: checked,
      });
      await this.loadProband();
      this.dialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: 'DIALOG.TEST_PROBAND_STATE_UPDATED',
          isSuccess: true,
        },
      });
    } catch (error) {
      this.alertService.errorObject(error);
    }
    this.isLoading = false;
  }

  public openSampleManagement(): void {
    this.router
      .navigate(['/sample-management/', this.pseudonym])
      .catch((e) => this.alertService.errorObject(e));
  }

  public openLoginLetter(): void {
    this.dataService.setPlannedProbandsForLetters([this.plannedProband]);
    this.router
      .navigate(['/collective-login-letters'])
      .catch((e) => this.alertService.errorObject(e));
  }

  private async loadProband(): Promise<void> {
    this.plannedProband = await this.userService
      .getPlannedProband(this.pseudonym)
      .catch(() => {
        return null;
      });

    this.proband = await this.userService
      .getProband(this.pseudonym)
      .catch((e) => {
        console.log(e);
        return null;
      });
  }

  private showFailureDialog(errorType: CreateProbandError): void {
    this.dialog.open<DialogPopUpComponent, DialogPopUpData>(
      DialogPopUpComponent,
      {
        width: '500px',
        data: {
          content: 'PROBAND.ERROR.' + errorType,
          isSuccess: false,
        },
      }
    );
  }

  private showSuccessDialog(): void {
    this.dialog.open<DialogPopUpComponent, DialogPopUpData>(
      DialogPopUpComponent,
      {
        width: '500px',
        data: {
          content: 'DIALOG.CREATE_PROBAND_SUCCESS',
          isSuccess: true,
        },
      }
    );
  }
}
