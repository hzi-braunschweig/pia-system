import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { PlannedProband } from 'src/app/psa.app.core/models/plannedProband';
import { User } from 'src/app/psa.app.core/models/user';
import { DataService } from 'src/app/_services/data.service';
import { SelectedProbandInfoService } from '../../../_services/selected-proband-info.service';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';

@Component({
  templateUrl: 'proband.component.html',
  styleUrls: ['proband.component.scss'],
})
export class ProbandComponent implements OnInit, OnDestroy {
  pseudonym: string;
  isDataReady: boolean = false;
  wasCreated: boolean = null;
  probandExists: boolean = null;
  isTestProband: boolean = false;

  proband: User = null;
  plannedProband: PlannedProband = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog,
    private userService: AuthService,
    private auth: AuthenticationManager,
    private router: Router,
    private selectedProbandInfoService: SelectedProbandInfoService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.pseudonym = this.activatedRoute.snapshot.paramMap.get('pseudonym');
    this.wasCreated = this.activatedRoute.snapshot.queryParamMap.get('created')
      ? this.activatedRoute.snapshot.queryParamMap.get('created') === 'true'
      : null;

    if (this.wasCreated === false) {
      this.showFailureDialog();
    } else if (this.wasCreated === true) {
      this.showSuccessDialog();
    }

    if (this.wasCreated !== false && this.pseudonym) {
      this.loadProband();
    } else {
      this.probandExists = false;
    }
  }

  ngOnDestroy(): void {
    if (this.auth.currentRole === 'Untersuchungsteam') {
      this.selectedProbandInfoService.updateSideNavInfoSelectedProband(null);
    }
  }

  async loadProband(): Promise<void> {
    this.plannedProband = await this.userService
      .getPlannedProband(this.pseudonym)
      .catch((e) => {
        return null;
      });

    this.proband = await this.userService.getUser(this.pseudonym).catch((e) => {
      console.log(e);
      return null;
    });

    if (this.auth.currentRole === 'Untersuchungsteam') {
      this.selectedProbandInfoService.updateSideNavInfoSelectedProband({
        ids: this.proband['ids'],
        pseudonym: this.proband['username'],
      });
    }

    this.isTestProband = this.proband ? this.proband['is_test_proband'] : false;
    this.probandExists = this.proband ? true : false;
    this.isDataReady = true;
  }

  async changeTestprobandState($event): Promise<void> {
    let state;
    $event.checked === true ? (state = true) : (state = false);
    const message = 'DIALOG.TEST_PROBAND_STATE_UPDATED';
    await this.userService
      .putUser(this.pseudonym, { is_test_proband: state })
      .then((result) => {
        this.dialog.open(DialogPopUpComponent, {
          width: '500px',
          data: { data: '', content: message, isSuccess: true },
        });
      })
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  showFailureDialog(): void {
    setTimeout(() => {
      const message = 'DIALOG.CREATE_PROBAND_ERROR';
      this.dialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: message,
          isSuccess: false,
        },
      });
    });
  }

  showSuccessDialog(): void {
    setTimeout(() => {
      const message = 'DIALOG.CREATE_PROBAND_SUCCESS';
      this.dialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          data: '',
          content: message,
          isSuccess: true,
        },
      });
    });
  }

  openSampleManagement(): void {
    this.router.navigate(['/sample-management/', this.pseudonym]);
  }

  openLoginLetter(): void {
    this.dataService.setPlannedProbandsForLetters([this.plannedProband]);
    this.router.navigate(['/collective-login-letters']);
  }
}
