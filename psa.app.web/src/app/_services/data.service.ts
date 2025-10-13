/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class DataService {
  private readonly statusSource = new BehaviorSubject<string>('');
  currentStatus = this.statusSource.asObservable();

  private readonly currentProbandsList = new BehaviorSubject<any>([]);
  probandsForLetters = this.currentProbandsList.asObservable();

  private readonly currentPlannedProbandsList = new BehaviorSubject<any>([]);
  plannedProbandsForLetters = this.currentPlannedProbandsList.asObservable();

  constructor() {}

  changeQuestionnaireInstanceStatus(
    changeQuestionnaireInstanceStatus: string
  ): void {
    this.statusSource.next(changeQuestionnaireInstanceStatus);
  }

  setProbandsForCreateLetters(changeProbandsForLetters: any): void {
    this.currentProbandsList.next(changeProbandsForLetters);
  }

  setPlannedProbandsForLetters(changePlannedProbandsForLetters: any): void {
    this.currentPlannedProbandsList.next(changePlannedProbandsForLetters);
  }
}
