/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { DialogChangeStudyComponent } from '../../dialogs/dialog-change-study/dialog-change-study.component';
import { catchError, filter, mapTo, mergeMap } from 'rxjs/operators';
import { Study } from '../../psa.app.core/models/study';
import { MatDialog } from '@angular/material/dialog';
import { DialogYesNoComponent } from '../../_helpers/dialog-yes-no';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { from, Observable } from 'rxjs';
import { DialogPopUpComponent } from '../../_helpers/dialog-pop-up';
import { isSpecificHttpError } from '../../psa.app.core/models/specificHttpError';
import { DialogStudyComponent } from '../../dialogs/study-dialog/study-dialog';

@Injectable({
  providedIn: 'root',
})
export class StudyChangeService {
  constructor(
    private readonly authService: AuthService,
    private readonly dialog: MatDialog
  ) {}

  public changeStudyAsSysAdmin(
    studyName?: string
  ): Observable<Study | undefined> {
    return this.dialog
      .open(DialogStudyComponent, {
        width: '500px',
        data: { name: studyName },
      })
      .afterClosed()
      .pipe(filter(Boolean));
  }

  /**
   * Shows study change dialog and a result dialog afterwards.
   *
   * Only for role Forscher.
   *
   * @returns Observable which does only emit when something changed
   */
  public requestStudyChange(study: Study): Observable<true> {
    return this.openStudyChangeDialog(study);
  }

  /**
   * Shows study change review dialog and a result dialog afterwards.
   *
   * @returns Observable which does only emit when something changed
   */
  public reviewPendingStudyChange(study: Study): Observable<true> {
    return this.openStudyChangeDialog(study);
  }

  /**
   * Shows double-check dialog before it requests the pending
   * study change deletion and shows also result dialog afterwards.
   *
   * @returns Observable which does only emit when the deletion was successful
   */
  public cancelPendingStudyChange(
    pendingStudyChangeId: number
  ): Observable<true> {
    return this.dialog
      .open(DialogYesNoComponent, {
        data: { content: 'STUDY.CANCEL_CHANGES_CONFIRMATION_QUESTION' },
      })
      .afterClosed()
      .pipe(
        filter((result) => result === 'yes'),
        mergeMap(() =>
          from(this.authService.deletePendingStudyChange(pendingStudyChangeId))
        ),
        mergeMap(() =>
          this.showResultDialog('STUDIES.CHANGE_COMPLIANCES_REJECTED', true)
        ),
        catchError((err) =>
          this.showResultDialog(this.getErrorMessage(err), false)
        ),
        mapTo(true)
      );
  }

  private openStudyChangeDialog(study: Study): Observable<true> {
    return this.dialog
      .open(DialogChangeStudyComponent, {
        width: study.pendingStudyChange ? '1100px' : '700px',
        height: 'auto',
        data: { study },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        mergeMap((result) => {
          if (result === 'rejected') {
            return this.showResultDialog(
              'STUDIES.CHANGE_COMPLIANCES_REJECTED',
              false
            );
          } else if (result === 'accepted') {
            return this.showResultDialog(
              'STUDIES.CHANGE_COMPLIANCES_ACCEPTED',
              true
            );
          } else if (result === 'requested') {
            return this.showResultDialog(
              'STUDIES.CHANGE_COMPLIANCES_REQUESTED',
              true
            );
          } else {
            return this.showResultDialog(this.getErrorMessage(result), false);
          }
        }),
        mapTo(true)
      );
  }

  private showResultDialog(
    content: string,
    isSuccess: boolean
  ): Observable<boolean> {
    return this.dialog
      .open(DialogPopUpComponent, {
        width: '300px',
        data: { content, isSuccess },
      })
      .afterClosed();
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
