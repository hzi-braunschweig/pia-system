/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { Study } from 'src/app/psa.app.core/models/study';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
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
  studies: Study[];
  newSelectedStudy: Study;
  selectedStudy: Study;
  selectedStudyWelcomeText: string;
  preview = false;

  constructor(
    private userService: UserService,
    private alertService: AlertService,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.studies = await this.userService.getStudies();
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }

  async onSelectStudy(selectedStudy: Study): Promise<void> {
    this.selectedStudy = selectedStudy;
    this.userService
      .getStudyWelcomeText(this.selectedStudy.name)
      .then(
        (res: StudyWelcomeText) =>
          (this.selectedStudyWelcomeText = res?.welcome_text ?? '')
      )
      .catch((err) => {
        this.alertService.errorObject(err);
        console.error(err);
      });
  }

  private async doPublish(): Promise<void> {
    try {
      await this.userService.putStudyWelcomeText(
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
