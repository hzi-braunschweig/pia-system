/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * This service provides info on the currently selected/processed proband by the Untersuchungsteam
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SelectedProbandData } from '../psa.app.core/models/selectedProbandData';
@Injectable()
export class SelectedProbandInfoService {
  private sideNavInfoSelectedProband: BehaviorSubject<SelectedProbandData> =
    new BehaviorSubject<SelectedProbandData>(null);
  public sideNavState$: Observable<SelectedProbandData> =
    this.sideNavInfoSelectedProband.asObservable();

  updateSideNavInfoSelectedProband(updatedVars: SelectedProbandData): void {
    this.sideNavInfoSelectedProband.next(updatedVars);
  }
}
