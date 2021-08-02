/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { Studie } from 'src/app/psa.app.core/models/studie';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from 'src/app/_services/alert.service';
import { DialogPopUpComponent } from '../../_helpers/dialog-pop-up';
import { MatDialog } from '@angular/material/dialog';
import { StudyWelcomeText } from 'src/app/psa.app.core/models/studyWelcomeText';

@Component({
  selector: 'app-study-welcome-text',
  templateUrl: './study-welcome-text.component.html',
  styleUrls: ['./study-welcome-text.component.scss'],
})
export class StudyWelcomeTextComponent implements OnInit {
  studies: Studie[];
  newSelectedStudy: Studie;
  selectedStudy: Studie;
  selectedStudyWelcomeText: string;
  preview = false;

  constructor(
    private questionnaireService: QuestionnaireService,
    private alertService: AlertService,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    this.studies = await this.questionnaireService
      .getStudies()
      .then((result: any) => result.studies)
      .catch((err) => this.alertService.errorObject(err));
  }

  async onSelectStudy(selectedStudy: Studie): Promise<void> {
    this.selectedStudy = selectedStudy;
    this.questionnaireService
      .getStudyWelcomeText(this.selectedStudy.name)
      .then(
        (res: StudyWelcomeText) =>
          (this.selectedStudyWelcomeText = res.welcome_text)
      )
      .catch((err) => {
        this.alertService.errorObject(err);
        console.error(err);
      });
  }

  private async doPublish(): Promise<void> {
    try {
      await this.questionnaireService.putStudyWelcomeText(
        this.selectedStudy.name,
        this.selectedStudyWelcomeText
      );
      this.dialog.open(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'WELCOME_TEXT.PUBLISHED_SUCCESSFULLY',
          isSuccess: true,
        },
      });
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }
}
