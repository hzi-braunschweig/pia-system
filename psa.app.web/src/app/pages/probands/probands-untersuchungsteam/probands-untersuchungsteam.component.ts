/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogNewProbandComponent } from '../../../dialogs/new-proband-dialog/new-proband-dialog';
import { DialogNewIdsComponent } from 'src/app/dialogs/new-ids-dialog/new-ids-dialog';
import { DialogNewPseudonymComponent } from 'src/app/dialogs/new-pseudonym-dialog/new-pseudonym-dialog';
import { ProbandsListComponent } from '../../../features/probands-list/probands-list.component';

@Component({
  selector: 'app-probands-untersuchungsteam',
  templateUrl: 'probands-untersuchungsteam.component.html',
  styleUrls: ['probands-untersuchungsteam.component.scss'],
})
export class ProbandsUntersuchungsteamComponent {
  @ViewChild(ProbandsListComponent, { static: true })
  probandsList: ProbandsListComponent;

  isLoading = true;

  constructor(private router: Router, private dialog: MatDialog) {}

  createIDS(): void {
    const dialogRef = this.dialog.open(DialogNewIdsComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined && result.pseudonym) {
        this.probandsList.fetchUsers();
      }
    });
  }

  addOrEditProband(): void {
    const dialogRef = this.dialog.open(DialogNewProbandComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined && result.pseudonym) {
        this.viewDetailsForProband(result.pseudonym);
      }
    });
  }

  viewDetailsForProband(username: string): void {
    this.router.navigate(['/probands/', username]);
  }

  addPseudonym(ids: string): void {
    const dialogRef = this.dialog.open(DialogNewPseudonymComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: true,
      data: {
        ids,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined && result.pseudonym) {
        this.viewDetailsForProband(result.pseudonym);
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
