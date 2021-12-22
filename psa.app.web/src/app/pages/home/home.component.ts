/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { NotificationService } from 'src/app/psa.app.core/providers/notification-service/notification-service';
import { NotificationComponent } from '../../_helpers/notification';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  currentRole: string;
  androidLink = 'https://play.google.com/store/apps/details?id=de.pia.app';
  iOSLink = 'https://apps.apple.com/de/app/pia-epidemiologie/id1510929221';
  welcomeText: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private notificationService: NotificationService,
    private authService: AuthService,
    private auth: AuthenticationManager,
    private questionnaireService: QuestionnaireService,
    private notification: NotificationComponent
  ) {
    this.currentRole = this.auth.getCurrentRole();
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params.notification_id) {
        this.getNotificationData(params.notification_id);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    if (this.currentRole === 'Proband') {
      const welcomeTextObj =
        await this.questionnaireService.getStudyWelcomeText(
          this.auth.getCurrentStudy()
        );
      if (welcomeTextObj) {
        this.welcomeText = welcomeTextObj.welcome_text;
      }
    }
  }

  getNotificationData(notification_id): void {
    this.notificationService
      .getNotificationById(notification_id)
      .then((notificationResponse) => {
        switch (notificationResponse.notification_type) {
          case 'qReminder': {
            this.notification.presentQreminder(notificationResponse);
            break;
          }
          case 'sample': {
            this.notification.presentLabReport(notificationResponse);
            break;
          }
          case 'custom': {
            this.notification.presentCustom(notificationResponse);
            break;
          }
          default: {
            console.log("Invalid choice of notification's type");
            break;
          }
        }
      })
      .catch((err) => {
        console.log(JSON.stringify(err));
      });
  }
}
