/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ViewChild } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Router } from '@angular/router';
import {
  DialogNewProbandComponent,
  DialogNewProbandComponentData,
} from '../../../dialogs/new-proband-dialog/new-proband-dialog';
import { DialogNewIdsComponent } from 'src/app/dialogs/new-ids-dialog/new-ids-dialog';
import { ProbandsListComponent } from '../../../features/probands-list/probands-list.component';

@Component({
  selector: 'app-probands-untersuchungsteam',
  templateUrl: 'probands-untersuchungsteam.component.html',
  styleUrls: ['probands-untersuchungsteam.component.scss'],
})
export class ProbandsUntersuchungsteamComponent {
  @ViewChild(ProbandsListComponent, { static: true })
  probandsList: ProbandsListComponent;

  isLoading = false;

  constructor(private router: Router, private dialog: MatDialog) {}

  createIDS(): void {
    const dialogRef = this.dialog.open(DialogNewIdsComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((pseudonym) => {
      if (pseudonym) {
        this.probandsList.fetchProbands();
      }
    });
  }

  addOrEditProband(): void {
    const dialogRef = this.dialog.open<
      DialogNewProbandComponent,
      undefined,
      string
    >(DialogNewProbandComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((pseudonym) => {
      if (pseudonym) {
        this.viewDetailsForProband(pseudonym);
      }
    });
  }

  viewDetailsForProband(username: string): void {
    this.router.navigate(['/probands/', username]);
  }

  addPseudonym(ids: string): void {
    const dialogRef = this.dialog.open<
      DialogNewProbandComponent,
      DialogNewProbandComponentData,
      string
    >(DialogNewProbandComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: true,
      data: {
        ids,
      },
    });

    dialogRef.afterClosed().subscribe((pseudonym) => {
      if (pseudonym) {
        this.viewDetailsForProband(pseudonym);
      }
    });
  }

  viewQuestionnaireInstancesForUT(username: string): void {
    this.router.navigate([
      'studies/:studyName/probands',
      username,
      'questionnaireInstances',
    ]);
  }
}
