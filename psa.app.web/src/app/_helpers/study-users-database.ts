/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BehaviorSubject } from 'rxjs';
import { AlertService } from '../_services/alert.service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { StudyAccess } from '../psa.app.core/models/study_access';

/** An questionnaire database that the data source uses to retrieve data for the table. */
export class StudyUsersDatabase {
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<StudyAccess[]> = new BehaviorSubject<
    StudyAccess[]
  >([]);
  get data(): StudyAccess[] {
    return this.dataChange.value;
  }

  studyaccesses: StudyAccess[];
  constructor(
    private questionnaireService: QuestionnaireService,
    private alertService: AlertService,
    private name: string
  ) {
    this.questionnaireService.getStudyAccesses(name).then(
      (result: any) => {
        this.studyaccesses = result.study_accesses;
        this.studyaccesses.forEach((study, studyIndex) => {
          if (study.access_level === 'read') {
            study.access_level = 'DIALOG.READ';
          } else if (study.access_level === 'write') {
            study.access_level = 'DIALOG.WRITE';
          } else if (study.access_level === 'admin') {
            study.access_level = 'DIALOG.ADMIN';
          }
          const copiedData = this.data.slice();
          copiedData.push(study);
          this.dataChange.next(copiedData);
        });
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );
  }

  deleteUserFromStudy(username: string, study_id: string): void {
    this.questionnaireService.deleteUserFromStudy(username, study_id).then(
      (result: any) => {
        const succesText = result.body;
        const copiedData = this.data;
        const index = copiedData.findIndex((d) => d.user_id === username);
        copiedData.splice(index, 1);
        this.dataChange.next(copiedData);
      },
      (err) => {
        this.alertService.errorObject(err, 'DIALOG.STUDY_ACCESS_DELETE_ERR');
      }
    );
  }
}
