/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BehaviorSubject } from 'rxjs';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { Questionnaire } from '../../app/psa.app.core/models/questionnaire';
import { AlertService } from '../_services/alert.service';

/** An questionnaire database that the data source uses to retrieve data for the table. */
export class QuestionnaireDatabase {
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<Questionnaire[]> = new BehaviorSubject<
    Questionnaire[]
  >([]);
  get data(): Questionnaire[] {
    return this.dataChange.value;
  }
  questionnaires: Questionnaire[];

  constructor(
    private questionnaireService: QuestionnaireService,
    private alertService: AlertService
  ) {}

  deleteQuestionnaire(id: number, version: number): void {
    this.questionnaireService.deleteQuestionnaire(id, version).then(
      () => {
        const copiedData = this.data;
        const index = copiedData.findIndex(
          (d) => d.id === id && d.version === version
        );
        copiedData.splice(index, 1);
        this.dataChange.next(copiedData);
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );
  }

  insertData(questionnaires): void {
    this.dataChange.next(questionnaires);
  }
}
